export default {

    "language": "中",

    //#region Namespace

    // system
    "system": "系统命名空间",
    "system.array": "基础数组",
    "system.struct": "基础结构体",
    
    "system.bool" : "布尔值",
    "system.bool.error" :"必须是布尔值。",
    "system.date": "日期",
    "system.date.error": "必须是日期。",
    "system.number": "数值",
    "system.number.error": "必须是数字。",
    "system.double": "双精度浮点数",
    "system.double.error": "必须是双精度浮点数。",
    "system.float": "浮点数",
    "system.float.error": "请输入正确内容，仅限数字",
    "system.percent": "百分比",
    "system.fulldate": "年月日时分秒",
    "system.fulldate.error": "请输入正确的时间",
    "system.int": "整数",
    "system.int.error": "必须是整数",
    "system.string": "字符串",
    "system.year": "年份",
    "system.year.unit": "年",
    "system.yearmonth": "年月",
    "system.rangedate": "年月日时间范围",
    "system.rangedate.start": "起始时间",
    "system.rangedate.stop": "结束时间",
    "system.rangefulldate": "年月日时分秒时间范围",
    "system.rangemonth": "年月时间范围",
    "system.rangemonth.start": "起始月份",
    "system.rangemonth.stop": "结束月份",
    "system.rangeyear": "年时间范围",
    "system.rangeyear.start": "起始年份",
    "system.rangeyear.stop": "结束年份",
    "system.strings": "字符串列表类型",
    "system.numbers": "数值用数组",
    "system.ints": "整型数组",

    // system.conv
    "system.conv": "数值转换",    
    "system.conv.default": "缺省",
    "system.conv.null": "空值",

    // system.str
    "system.str": "字符串运算",
    "system.str.len": "获取字符串长度",
    "system.str.concat": "合并字符串",
    "system.str.substr": "截取字符串",
    "system.str.split": "分割字符串",

    // system.math
    "system.math": "算术运算",
    "system.math.pi": "圆周率",
    "system.math.e": "自然对数的底",
    "system.math.percent": "计算百分比",
    "system.math.abs": "绝对值",
    "system.math.ceiling": "向上取整",
    "system.math.clamp": "上下限截取",
    "system.math.floor": "向下取整",
    "system.math.max": "最大值",
    "system.math.min": "最小值",
    "system.math.percenttofloat": "百分比转换为小数",
    "system.math.round": "四舍五入",
    "system.math.todecimal": "转换为数值",
    "system.math.todouble": "转换为双精度浮点数",
    "system.math.tointeger": "转换为整数",
    "system.math.tosingle": "转换为单精度浮点数",
    "system.math.acos": "返回 x 的反余弦值",
    "system.math.asin": "返回 x 的反正弦值",
    "system.math.atan": "以介于 -PI/2 与 PI/2 弧度之间的数值来返回 x 的反正切值",
    "system.math.cos": "返回数的余弦",
    "system.math.sin": "返回数的正弦",
    "system.math.tan": "返回角的正切",
    "system.math.tanh": "返回一个数的双曲正切函数值",
    "system.math.acosh": "反双曲余弦",
    "system.math.asinh": "反双曲正弦",
    "system.math.atanh": "反双曲正切",
    "system.math.cosh": "双曲余弦",
    "system.math.sinh": "双曲正弦",
    "system.math.exp": "返回 Ex 的指数",
    "system.math.log": "返回数的自然对数（底为e）",
    "system.math.sqrt": "返回数的平方根",
    "system.math.cbrt": "立方根",
    "system.math.log10": "以10为底的对数",
    "system.math.log2": "以2为底的对数",
    "system.math.pow": "指数次幂",

    // system.datetime
    "system.datetime": "日期操作",
    "system.datetime.now": "获取当前时间",
    "system.datetime.getyear": "获取年份",
    "system.datetime.getmonth": "获取月份",
    "system.datetime.getday": "获取日",

    "system.datetime.equal": "等于",
    "system.datetime.greateequal": "大于等于",
    "system.datetime.greatethan": "大于",
    "system.datetime.lessequal": "小于等于",
    "system.datetime.lessthan": "小于",
    "system.datetime.notequal": "不等于",

    "system.datetime.addyears": "增加指定年份返回新日期",
    "system.datetime.addmonths": "增加指定月份返回新日期",
    "system.datetime.adddays": "增加指定日返回新日期",
    "system.datetime.addhours": "增加指定小时返回新日期",
    "system.datetime.addminutes": "增加指定分钟返回新日期",
    "system.datetime.addseconds": "增加指定秒返回新日期",
    "system.datetime.getyears": "获取间隔年份",
    "system.datetime.getmonths": "获取间隔月份",
    "system.datetime.getdays": "获取间隔天数",
    
    // system.collection
    "system.collection": "集合操作",
    "system.collection.arrlen": "获取数组长度",
    "system.collection.newstruct": "新建结构体",
    "system.collection.getfield": "获取字段",
    "system.collection.setfield": "写入字段返回新结构体",
    "system.collection.delfield": "删除字段返回新结构体",
    "system.collection.getfields": "从数组各个元素获取字段构成新数组",
    "system.collection.sum": "对数组进行合计",
    "system.collection.sumfields": "对数组各个元素的指定字段进行合计",
    "system.collection.average": "对数组求平均值",
    "system.collection.averagefields": "对数组的各个元素的指定字段求平均值",

    // system.logic
    "system.logic": "逻辑操作",
    "system.logic.andalso": "同时满足",
    "system.logic.between": "在范围内",
    "system.logic.cond": "条件选择",
    "system.logic.equal": "等于",
    "system.logic.greateequal": "大于等于",
    "system.logic.greatethan": "大于",
    "system.logic.isnull": "判定是否为空",
    "system.logic.notnull": "判定非空",
    "system.logic.lessequal": "小于等于",
    "system.logic.lessthan": "小于",
    "system.logic.not": "不满足",
    "system.logic.notcontains": "不含有指定值",
    "system.logic.notequal": "不等于",
    "system.logic.orelse": "任一满足",

    //#endregion

    //#region Message

    "ERR_CANT_BE_NULL": "{0}不能为空",
    "ERR_LEN_CANT_BE_GREATTHAN" : "{0}长度不能大于{1}","ERR_LEN_CANT_BE_LESSTHAN" : "{0}长度不能小于{1}",
    "ERR_REGEX_NOT_MATCH" : "{0}格式不正确",
    "ERR_NOT_IN_ENUMLIST": "{0}必须从列表中选取",
    "ERR_NOT_NUMBER": "{0}不是有效的数值",
    "ERR_CANT_BE_GREATTHAN": "{0}不能大于{1}",
    "ERR_CANT_BE_LESSTHAN": "{0}不能小于{1}",
    "ERR_NOT_DATE": "{0}不是有效的日期",
    "ERR_ARRAY_DATA_NOT_VALID": "{0}数据无效",
    "ERR_ARRAY_PRIMARY_DUPLICATE": "{0}不能重复",

    "PLACEHOLDER_INPUT": "请输入{0}",
    "PLACEHOLDER_SELECT": "请选择{0}",

    //#endregion

    //#region Common 

    "YES": "是",
    "NO": "否",

    "OPER": "操作",
    "ADD": "添加",
    "DEL": "删除",

    //#endregion
}