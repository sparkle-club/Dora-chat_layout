import { Node, Label, TextAlign, Vec2, Color, DrawNode, ClipNode, Size, View } from 'Dora';
export type OptionClickHandler = (choiceIndex: number) => void;
export type ChatClickHandler = () => void;

export interface ChatComponentConfig {
	x: number; // x 坐标 
	y: number; // y 坐标
	width: number; // 宽度
	height: number; // 高度
	chatSize: number; // 聊天字体大小
	labelSize:number; // 标题字体大小
	titletxt:string; // 标题文本
	fontPath: string; // 字体路径
	borderWidth: number; // 边框宽度
	borderColor:Color.Type; // 边框颜色
	chatColor: Color.Type;// 聊天文字颜色
	labelColor:Color.Type;// 标题文字颜色
	onOptionClick: OptionClickHandler; // 选项点击回调
	onChatClick: ChatClickHandler; // 聊天点击回调
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
		this.startChat = labelSize;
		const mainNode = Node();
		this.chatNode = Node();
		this.boxNode = Node();
		this.uiNode = Node();
		
		// 创建一个 DrawNode 用于创建遮罩
		const maskA = DrawNode();
		maskA.drawPolygon([
			Vec2(0, 0),
			Vec2(0, this.height-labelSize), // 空出标题位置
			Vec2(width, this.height-labelSize),
			Vec2(width, 0)
		]);
		const clipNode = ClipNode(maskA);

		clipNode.addChild(this.chatNode, 1);// 控制渲染层级，1会被2覆盖
		clipNode.addChild(this.boxNode, 2);

		mainNode.addChild(clipNode);

		mainNode.x = x;
		mainNode.y = y;
		this.boxNode.y = height;

		const titleLabel = Label(fontPath, labelSize);
		if (!titleLabel) error("failed to create label!"); // 如果没有正确的初始化，则直接报错
		titleLabel.text = titletxt;
		titleLabel.anchor = Vec2(0, 1); // 修改节点的锚点（x,y）代表的点的相对位置（0,0）为左下角，（1,1）为右上角
		titleLabel.textWidth = width;
		titleLabel.color = labelColor;
		titleLabel.alignment = TextAlign.Left;
		titleLabel.y = height ; // 由于titleLabel是uiNode的子节点，而uiNode又是mainNode的子节点，所以实际上titleLabel的绝对y坐标为:titleLabel.y+uiNode.y+mainNode.y = height+0+y
		this.uiNode.addChild(titleLabel);

		// 添加滚动功能
		clipNode.onTapMoved(touch => { // 检测到移动时
			const newPos = this.chatNode.position.add(
				Vec2(0, touch.delta.y).normalize().mul(8)
			); // 修改聊天主节点的y值，normalize()大多数时候就是有移动就变为对应方向的1，而mul()则是用来控制拖动的速度
			this.chatNode.position = newPos; // 更新
		});

		// 添加点击功能，触发对话推进
		clipNode.onTapEnded(touch => {
			if (touch.delta.y < 0.1) {
				this.onChatClick();
			}
		});
		this.uiNode.addChild(this.create_ui(labelSize,borderWidth,borderColor));
		mainNode.addChild(this.uiNode);
		this.node = mainNode;
		
	}

	addMessage(in_left:boolean,role: string, text: string): void {
		const messageNode = Node(); // 定义当前信息的根节点
		const nameLabel = Label(this.fontPath, this.chatSize)!; // 定义名称(!表示无视格式检测，防止爆红)
		const textLabel = Label(this.fontPath, this.chatSize)!; // 定义信息
		const chatSpace = this.width; // 定义聊天框的宽度

		nameLabel.y = 0; // 由于后续将Label的锚点设置为了上方，所以直接设置为0即可
		textLabel.y = nameLabel.y - this.chatSize; // 信息的y坐标需要在下移一个字符的高度实现类似于换行的效果
		messageNode.addChild(nameLabel); // 添加至根节点方便统一管理位置
		messageNode.addChild(textLabel); // 添加至根节点方便统一管理位置
		messageNode.y = this.height - this.startChat ; // 设置根节点的位置为this.startChat

		nameLabel.color = this.chatColor; // 设置颜色
		textLabel.color = this.chatColor; // 设置颜色
		nameLabel.textWidth = chatSpace; // 宽度设置为整个聊天框的宽度
		textLabel.textWidth = chatSpace; // 宽度设置为整个聊天框的宽度

		textLabel.text = text; // 设置信息
		nameLabel.text = role + ":"; // 设置名称

		if (in_left) { // 如果是左边
			nameLabel.anchor = Vec2(0, 1.0); // 设置锚点为左上角
			textLabel.anchor = Vec2(0, 1.0); // 设置锚点为左上角
			nameLabel.x = this.chatSize; // 空出一个字符的宽度以保证显示的美观
			textLabel.x = this.chatSize; // 空出一个字符的宽度以保证显示的美观
			nameLabel.alignment = TextAlign.Left; // 设置对齐方式为左对齐
			textLabel.alignment = TextAlign.Left; // 设置对齐方式为左对齐
		} else { // 否则是右边
			nameLabel.anchor = Vec2(1.0, 1.0); // 锚点设置为右上角
			textLabel.anchor = Vec2(1.0, 1.0); // 锚点设置为右上角
			nameLabel.x = this.width - this.chatSize; // 空出一个字符的宽度以保证显示的美观
			textLabel.x = this.width - this.chatSize; // 空出一个字符的宽度以保证显示的美观
			nameLabel.alignment = TextAlign.Right; // 设置对齐方式为右对齐
			textLabel.alignment = TextAlign.Right; // 设置对齐方式为右对齐
		}
		this.startChat += textLabel.height + this.chatSize; // 计算下一个聊天节点的起始位置
		this.chatNode.addChild(messageNode); // 将当前聊天节点加入聊天主节点进行管理
	}

	createOption(
		text: string,
		choiceIndex: number,
		fillColor: Color.Type = Color(0xffffffff),
		borderColor: Color.Type = Color(0x00000000)
	): void {
		const buttonNode = Node(); // 创建按钮节点
		const buttonUI = DrawNode(); // 创建按钮UI
		const buttonLayout = Node(); // 创建按钮布局
		const label = Label(this.fontPath, this.chatSize)!; // 创建按钮文字
		buttonNode.addChild(buttonLayout); // 最先加载布局，作为基底（不带ui，不影响效果）
        buttonNode.addChild(buttonUI, 1); // 后加载底部的绘制
		buttonNode.addChild(label, 2); // 最后加载顶部的文字

		label.alignment = TextAlign.Left; // 设置对齐方式为左对齐
		label.color = this.chatColor; // 设置文字颜色
		label.text = "   " + text; // 设置文字内容
		label.textWidth = this.width - this.chatSize * 2; // 设置文字宽度(左右各空出一个字符的位置)
		buttonUI.x = this.chatSize // 设置按钮的x坐标(空出一个字符的位置)
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
		); // 绘制按钮背景区域,

		buttonNode.y = this.startBox + this.chatSize; // 
		
		// 扩大 buttonLayout 的点击区域，覆盖整个按钮宽度
		buttonLayout.size = Size(this.width- this.chatSize*2, label.height);
		buttonLayout.x = this.chatSize; // 偏移以覆盖整个宽度
		buttonLayout.anchor = Vec2(0,0)
		buttonLayout.onTapBegan(touch => {
			touch.enabled = false; // 阻止事件继续传播
			this.onOptionClick(choiceIndex); // 注册回调函数
			this.clearOptions();
		});

		this.boxNode.addChild(buttonNode); // 将按钮节点加入选项主节点进行管理
		this.startBox += label.height + this.chatSize / 2; // 计算下一个选项节点的起始位置
		this.optionCount++; // 计算选项数量
	}

	clearOptions(): void {
		this.boxNode.removeAllChildren();
		this.startBox = -this.height;
		this.optionCount = 0;
	}

	hasOptions(): boolean {
		return this.optionCount > 0;
	}
	create_ui(labelSize:number,borderWidth:number,borderColor:Color.Type){
		const ui = DrawNode()
		ui.drawSegment(Vec2(0,this.height-labelSize),Vec2(this.width,this.height-labelSize),borderWidth)
		ui.drawPolygon([Vec2(0,0),Vec2(0,this.height),Vec2(this.width,this.height),Vec2(this.width,0)],Color(0),borderWidth,borderColor) 
		return ui 
	}
}
// const test = new ChatComponent()
// test.addMessage(true,"test","123121231231231231")
// test.addMessage(false,"test","12311231231231231232")