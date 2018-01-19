// Add here you code for quick test, this file is excluded from git repository
// import local files or external modules
// (you may use vscode launch configuration to run this file)

const run = async () => {
  let testPass = false;
  let asyncMessage = () => Promise.resolve('Test OK!');
  let asyncError = () => Promise.reject('Test fail.');

  try {
    let asyncAction = testPass ? asyncMessage : asyncError;
    let message = await asyncAction();
    console.log(message);
  } catch (err) {
    console.error(err);
  }
};

run();
