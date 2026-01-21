/**
 * Wrapper function to catch async errors in controllers
 * Eliminates the need for try-catch blocks in every async function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;
