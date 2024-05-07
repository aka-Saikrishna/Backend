// Promises code
const asyncHandler = (requestHandler) => {
   return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err)=> next(err))
    }
        
}

export { asyncHandler }


// const asyncHandler = () => {}
// const asyncHandler = (func) => {}
// const asyncHandler = (func) => {() => {}}


//Try-catch code
// const asyncHandler = (fn) => async( req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         rex.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }