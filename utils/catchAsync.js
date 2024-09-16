module.exports = fn => {
    //catch async fucntion will call a new async function
    return (req, res, next) => {
        fn(req, res, next).catch(next) //this catch function will catch the error in the next function
    }

}

