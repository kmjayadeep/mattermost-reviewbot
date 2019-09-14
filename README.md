# mattermost-reviewbot
A script which keeps track of existing reviews and posts new ones to Mattermost

## Example Output to Mattermost

![Example Mattermost Output](https://user-images.githubusercontent.com/5188694/64906324-79278a00-d6e5-11e9-8550-87e8b65e45b2.png "Example Output")

## USAGE

### Environment Variables:

* IOS_APPID="AppId of your iOS App, visible on the Store Page Url"
* ANDROID_PACKAGENAME="Package name of your Android App, also visible in the store Url"
* GOOGLE_CLIENT_EMAIL: To be fetched from the googlePlay Account JSON
* GOOGLE_CLIENT_PRIVATEKEY: To be fetched from the googlePlay Account JSON
* MM_WEBHOOK_URL: URL of your webhook (e.g. `https://matter.i.daimler.com/hooks/dajojadiooimaasb1337`)
* DATA_DIRECTORY: Directory where the process can persists it's state


### Running it
```bash
npm install

GOOGLE_CLIENT_EMAIL="SOME_EMAIL_CLIENT" \
GOOGLE_CLIENT_PRIVATEKEY="XXX" \
MM_WEBHOOK_URL="MATTERMOST_WEBHOOK_URL" \
DATA_DIRECTORY="ABSOLUTE_DIRECTORY_WHERE_PROCESS_CAN_WRITE" \
ANDROID_PACKAGENAME="Package name of your Android App" \
IOS_APPID="AppId of your iOS App" \
node reviewBot.js
```
