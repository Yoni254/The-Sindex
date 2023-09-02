const errorHandler = (handler) => {
    return async (req, res, next) => {
        try {
            await handler(req, res, next);
        } catch (error) {
            console.log("Error handler triggered ", error)
            res.status(400).json({ success: false, message: 'Error in server' })
        }
    };
};

module.exports = errorHandler;