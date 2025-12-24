// middleware/asyncHandler.js
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    try {
      const promise = fn(req, res, next);

      // กรณี fn ไม่ได้ return promise (sync function)
      if (promise && promise instanceof Promise) {
        promise.catch(err => next(err));
      }
    } catch (err) {
      // จับ error ที่เกิดขึ้นก่อนถึง promise (sync error)
      next(err);
    }
  };
};
