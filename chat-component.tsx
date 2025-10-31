import { Node, Label, TextAlign, Vec2, Color, DrawNode, ClipNode, Size, View } from 'Dora';
export type OptionClickHandler = (choiceIndex: number) => void;
export type ChatClickHandler = () => void;

export interface ChatComponentConfig {
	x: number;
	y: number;
	width: number;
	height: number;
	chatSize: number;
	labelSize:number;
	titletxt:string;
	fontPath: string;
	borderWidth: number;
	borderColor:Color.Type;
	chatColor: Color.Type;
	labelColor:Color.Type;
	onOptionClick: OptionClickHandler;
	onChatClick: ChatClickHandler;
}
// 创建默认配置函数
export const getDefaultChatConfig = (): ChatComponentConfig => ({
  x: 0,
  y: 0,
  width: 500,
  height: 500,
  chatSize: 50,
	labelSize:Math.floor(View.size.width/ 25) - 10,
	titletxt:"测试标题",
  fontPath: 'Fonts/等距更纱黑体.ttf',
  borderWidth: 5,
  borderColor: Color(0xFFFFFFFF),
  chatColor: Color(0xFFFFFFFF),
  labelColor: Color(0xFFFFFFFF),
  onOptionClick: () => {},
  onChatClick: () => {}
});
/**
 * 聊天组件类
 */
export class ChatComponent {
	public readonly node: Node.Type;
	private chatNode: Node.Type;
	private boxNode: Node.Type;
	private startChat: number = 0;
	private startBox: number;
	private width: number;
	private height: number;
	private fontPath: string;
	private chatSize: number;
	private chatColor: Color.Type;
	private onOptionClick: OptionClickHandler;
	private onChatClick: ChatClickHandler;
	private optionCount: number = 0;
	private uiNode: Node.Type;
	constructor(config : Partial<ChatComponentConfig> = {}) {
    const finalConfig: ChatComponentConfig = {
        ...getDefaultChatConfig(),
        ...config
    };
		const {
			x, y, width, height,
			chatSize,labelSize,titletxt,fontPath,
			chatColor,labelColor,
			borderWidth,borderColor,
			onOptionClick,
			onChatClick
		} = finalConfig;

		this.onOptionClick = onOptionClick;
		this.onChatClick = onChatClick;

		// 确保 labelSize 是一个有效的整数（参考原始代码：math.floor(label_space) - 10）
		// 注意：由于 Director.entry.angle = -90，实际高度是 View.size.width


		this.width = width;
		this.height = height;
		this.fontPath = fontPath;
		this.chatSize = chatSize;
		this.chatColor = chatColor;
		this.startBox = -height;

		const mainNode = Node();
		this.chatNode = Node();
		this.boxNode = Node();
		this.uiNode = Node();

		const maskA = DrawNode();
		maskA.drawPolygon([
			Vec2(0, 0),
			Vec2(0, height),
			Vec2(width, height),
			Vec2(width, 0)
		]);
		const clipNode = ClipNode(maskA);
		clipNode.anchor = Vec2(0, 0);
		clipNode.width = width;
		clipNode.height = height;

		clipNode.addChild(this.chatNode, 1);
		clipNode.addChild(this.boxNode, 2);
		mainNode.addChild(clipNode);

		mainNode.x = x;
		mainNode.y = y;
		this.boxNode.y = height;

		const titleLabel = Label(fontPath, labelSize);
		if (!titleLabel) error("failed to create label!");
		titleLabel.text = titletxt;
		titleLabel.anchor = Vec2(0, 1);
		titleLabel.textWidth = width;
		titleLabel.color = labelColor;
		titleLabel.alignment = TextAlign.Left;
		titleLabel.y = height ;
		this.uiNode.addChild(titleLabel);

		// 添加滚动功能
		clipNode.onTapMoved(touch => {
			const newPos = this.chatNode.position.add(
				Vec2(0, -touch.delta.y).normalize().mul(8)
			);
			this.chatNode.position = newPos;
		});

		// 添加点击功能，触发对话推进
		clipNode.onTapEnded(touch => {
			if (touch.delta.y < 0.1) {
				this.onChatClick();
			}
		});

		this.node = mainNode;
		this.create_ui(labelSize,borderWidth,borderColor);
	}

	addMessage(in_left:boolean,role: string, text: string): void {
		const messageNode = Node();
		const nameLabel = Label(this.fontPath, this.chatSize)!;
		const textLabel = Label(this.fontPath, this.chatSize)!;
		const chatSpace = this.width / 2;

		nameLabel.y = 0;
		textLabel.y = nameLabel.y - this.chatSize;

		messageNode.addChild(nameLabel);
		messageNode.addChild(textLabel);
		messageNode.y = this.height - this.startChat - this.chatSize;

		nameLabel.color = this.chatColor;
		textLabel.color = this.chatColor;
		nameLabel.textWidth = chatSpace;
		textLabel.textWidth = chatSpace - this.chatSize * 2;

		textLabel.text = "  " + text;
		nameLabel.text = role + ":";

		if (in_left) {
			nameLabel.anchor = Vec2(0, 1.0);
			textLabel.anchor = Vec2(0, 1.0);
			nameLabel.x = this.chatSize;
			textLabel.x = this.chatSize;
			nameLabel.alignment = TextAlign.Left;
			textLabel.alignment = TextAlign.Left;
		} else {
			nameLabel.anchor = Vec2(1.0, 1.0);
			textLabel.anchor = Vec2(1.0, 1.0);
			nameLabel.x = this.width - this.chatSize;
			textLabel.x = this.width - this.chatSize;
			nameLabel.alignment = TextAlign.Right;
			textLabel.alignment = TextAlign.Right;
		}

		this.startChat += textLabel.height + this.chatSize;
		this.chatNode.addChild(messageNode);
	}

	createOption(
		text: string,
		choiceIndex: number,
		fillColor: Color.Type = Color(0xffffffff),
		borderColor: Color.Type = Color(0x00000000)
	): void {
		const buttonNode = Node();
		const buttonUI = DrawNode();
		const buttonLayout = Node();
		const label = Label(this.fontPath, this.chatSize)!;

		buttonNode.addChild(label, 2);
		buttonNode.addChild(buttonUI, 1);
		buttonNode.addChild(buttonLayout);

		label.anchor = Vec2(0.0, 0.0);
		label.alignment = TextAlign.Left;
		label.color = this.chatColor;
		label.text = "   " + text;
		label.textWidth = this.width - this.chatSize * 2;
		buttonUI.x = this.chatSize
		buttonUI.drawPolygon(
			[
				Vec2(0, 0),
				Vec2(0, label.height),
				Vec2(this.width - this.chatSize*2, label.height),
				Vec2(this.width - this.chatSize*2, 0)
			],
			fillColor,
			2,
			borderColor
		);

		buttonNode.y = this.startBox + this.chatSize;
		
		// 扩大 buttonLayout 的点击区域，覆盖整个按钮宽度
		buttonLayout.size = Size(this.width- this.chatSize*2, label.height);
		buttonLayout.x = this.chatSize; // 偏移以覆盖整个宽度
		buttonLayout.anchor = Vec2(0,0)
		buttonLayout.onTapBegan(touch => {
			touch.enabled = false; // 阻止事件继续传播
			this.onOptionClick(choiceIndex);
			this.clearOptions();
		});

		this.boxNode.addChild(buttonNode);
		this.startBox += label.height + this.chatSize / 2;
		this.optionCount++;
	}

	clearOptions(): void {
		this.boxNode.removeAllChildren();
		this.startBox = -this.height;
		this.optionCount = 0;
	}

	hasOptions(): boolean {
		return this.optionCount > 0;
	}
	create_ui(labelSize:number,borderWidth:number,borderColor:Color.Type):void{
		const ui = DrawNode()
		ui.drawSegment(Vec2(0,this.height-labelSize),Vec2(this.width,this.height-labelSize),borderWidth)
		ui.drawPolygon([Vec2(0,0),Vec2(0,this.height),Vec2(this.width,this.height),Vec2(this.width,0)],Color(0),borderWidth,borderColor) 
	}
}
