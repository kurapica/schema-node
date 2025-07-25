export default {

    "language": "EN",

    //#region Namespace

    // system
    "system": "System Namespace",
    "system.array": "Basic Array",
    "system.struct": "Basic Structure",

    "system.bool": "Boolean",
    "system.bool.error": "Must be a boolean.",
    "system.date": "Date",
    "system.date.error": "Must be a valid date.",
    "system.number": "Number",
    "system.number.error": "Must be a number.",
    "system.double": "Double",
    "system.double.error": "Must be a double.",
    "system.float": "Float",
    "system.float.error": "Please enter a valid number.",
    "system.percent": "Percentage",
    "system.fulldate": "Full Date Time",
    "system.fulldate.error": "Please enter a valid datetime.",
    "system.int": "Integer",
    "system.int.error": "Must be an integer.",
    "system.string": "String",
    "system.year": "Year",
    "system.year.unit": "Year",
    "system.yearmonth": "Year-Month",
    "system.rangedate": "Date Range",
    "system.rangedate.start": "Start Time",
    "system.rangedate.stop": "End Time",
    "system.rangefulldate": "Full Date Time Range",
    "system.rangemonth": "Month Range",
    "system.rangemonth.start": "Start Month",
    "system.rangemonth.stop": "End Month",
    "system.rangeyear": "Year Range",
    "system.rangeyear.start": "Start Year",
    "system.rangeyear.stop": "End Year",
    "system.strings": "String List",
    "system.numbers": "Number Array",
    "system.ints": "Integer Array",

    // system.conv
    "system.conv": "Number Conversion",
    "system.conv.default": "Default",
    "system.conv.null": "Null",

    // system.str
    "system.str": "String Operations",
    "system.str.len": "Get String Length",
    "system.str.concat": "Concatenate Strings",
    "system.str.substr": "Substring",
    "system.str.split": "Split String",

    // system.math
    "system.math": "Math Operations",
    "system.math.pi": "Pi",
    "system.math.e": "Euler's Number",
    "system.math.percent": "Calculate Percentage",
    "system.math.abs": "Absolute Value",
    "system.math.ceiling": "Ceiling",
    "system.math.clamp": "Clamp",
    "system.math.floor": "Floor",
    "system.math.max": "Maximum",
    "system.math.min": "Minimum",
    "system.math.percenttofloat": "Convert Percentage to Float",
    "system.math.round": "Round",
    "system.math.todecimal": "To Decimal",
    "system.math.todouble": "To Double",
    "system.math.tointeger": "To Integer",
    "system.math.tosingle": "To Float",
    "system.math.acos": "Arc Cosine of x",
    "system.math.asin": "Arc Sine of x",
    "system.math.atan": "Arc Tangent of x between -PI/2 and PI/2",
    "system.math.cos": "Cosine",
    "system.math.sin": "Sine",
    "system.math.tan": "Tangent",
    "system.math.tanh": "Hyperbolic Tangent",
    "system.math.acosh": "Inverse Hyperbolic Cosine",
    "system.math.asinh": "Inverse Hyperbolic Sine",
    "system.math.atanh": "Inverse Hyperbolic Tangent",
    "system.math.cosh": "Hyperbolic Cosine",
    "system.math.sinh": "Hyperbolic Sine",
    "system.math.exp": "Exponential",
    "system.math.log": "Natural Logarithm (base e)",
    "system.math.sqrt": "Square Root",
    "system.math.cbrt": "Cube Root",
    "system.math.log10": "Base 10 Logarithm",
    "system.math.log2": "Base 2 Logarithm",
    "system.math.pow": "Exponentiation",

    // system.datetime
    "system.datetime": "Date Operations",
    "system.datetime.now": "Current Time",
    "system.datetime.getyear": "Get Year",
    "system.datetime.getmonth": "Get Month",
    "system.datetime.getday": "Get Day",

    "system.datetime.equal": "Equal",
    "system.datetime.greateequal": "Greater Than or Equal",
    "system.datetime.greatethan": "Greater Than",
    "system.datetime.lessequal": "Less Than or Equal",
    "system.datetime.lessthan": "Less Than",
    "system.datetime.notequal": "Not Equal",

    "system.datetime.addyears": "Add Years",
    "system.datetime.addmonths": "Add Months",
    "system.datetime.adddays": "Add Days",
    "system.datetime.addhours": "Add Hours",
    "system.datetime.addminutes": "Add Minutes",
    "system.datetime.addseconds": "Add Seconds",
    "system.datetime.getyears": "Get Year Difference",
    "system.datetime.getmonths": "Get Month Difference",
    "system.datetime.getdays": "Get Day Difference",

    // system.collection
    "system.collection": "Collection Operations",
    "system.collection.arrlen": "Get Array Length",
    "system.collection.newstruct": "Create Structure",
    "system.collection.getfield": "Get Field",
    "system.collection.setfield": "Set Field and Return New Structure",
    "system.collection.delfield": "Delete Field and Return New Structure",
    "system.collection.getfields": "Extract Field from Each Element",
    "system.collection.sum": "Sum Array",
    "system.collection.sumfields": "Sum Fields of Array Elements",
    "system.collection.average": "Average of Array",
    "system.collection.averagefields": "Average Fields of Array Elements",

    // system.logic
    "system.logic": "Logical Operations",
    "system.logic.andalso": "And Also",
    "system.logic.between": "Between",
    "system.logic.cond": "Conditional",
    "system.logic.equal": "Equal",
    "system.logic.greateequal": "Greater Than or Equal",
    "system.logic.greatethan": "Greater Than",
    "system.logic.isnull": "Is Null",
    "system.logic.notnull": "Not null",
    "system.logic.lessequal": "Less Than or Equal",
    "system.logic.lessthan": "Less Than",
    "system.logic.not": "Not",
    "system.logic.notcontains": "Does Not Contain",
    "system.logic.notequal": "Not Equal",
    "system.logic.orelse": "Or Else",

    //#endregion

    //#region Message

    "ERR_CANT_BE_NULL": "{0} cannot be empty",
    "ERR_LEN_CANT_BE_GREATTHAN": "{0} length cannot exceed {1}",
    "ERR_LEN_CANT_BE_LESSTHAN": "{0} length cannot be less than {1}",
    "ERR_REGEX_NOT_MATCH": "{0} format is incorrect",
    "ERR_NOT_IN_ENUMLIST": "{0} must be selected from the list",
    "ERR_NOT_NUMBER": "{0} is not a valid number",
    "ERR_CANT_BE_GREATTHAN": "{0} cannot be greater than {1}",
    "ERR_CANT_BE_LESSTHAN": "{0} cannot be less than {1}",
    "ERR_NOT_DATE": "{0} is not a valid date",
    "ERR_ARRAY_DATA_NOT_VALID": "{0} data is invalid",
    "ERR_ARRAY_PRIMARY_DUPLICATE": "{0} must be unique",

    "PLACEHOLDER_INPUT": "Please enter {0}",
    "PLACEHOLDER_SELECT": "Please select {0}",

    //#endregion

    //#region Common 

    "YES": "Yes",
    "NO": "No",

    "OPER": "Operation",
    "ADD": "Add",
    "DEL": "Delete",

    //#endregion
}
