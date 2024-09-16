class AppError extends Error{
constructor(message,statusCode)
{
    super(message)  //built in error only accpts msg params
    this.statusCode=statusCode
    this.isOperational=true
    this.status=`${statusCode}`.startsWith('4') ? ('fail'):('error')
    Error.captureStackTrace(this,this.constructor)  //1-this current object 2-app error class
}
}

module.exports=AppError