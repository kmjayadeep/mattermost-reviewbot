const dotenv = require('dotenv');

dotenv.config();
module.exports = {
  googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL,
  googleClientPrivateKey: process.env.GOOGLE_CLIENT_PRIVATEKEY,
  packageNameAndroid: process.env.ANDROID_PACKAGENAME,
  iosAppId: process.env.IOS_APPID,
  mattermostWebHookUrl: process.env.MM_WEBHOOK_URL,
  dataDirectory: process.env.DATA_DIRECTORY,
};
