/* eslint-disable no-console */

const { readFileSync, writeFile } = require('fs');
const { JWT } = require('google-auth-library');
const request = require('request');

const {
  mattermostWebHookUrl, googleClientEmail, googleClientPrivateKey, dataDirectory, packageNameAndroid, iosAppId,
} = require('./config');

const sendRequests = true;
const iosPlatform = 'ios';
const androidPlatform = 'android';
// this will be a mapping from language to array of reviewIds
// e.g. {'de': ['reviewId1','reviewId2']}
let lastIosIds = {};
let lastAndroidIds = [];

const androidIdFile = `${dataDirectory}/lastAndroidIds.id`;
const iosIdFile = `${dataDirectory}/lastIosIds.id`;
const androidUrl = `https://www.googleapis.com/androidpublisher/v2/applications/${packageNameAndroid}/reviews`;

const iosLanguages = ['de',
  'fr',
  'nl',
  'be',
  'it',
  'es',
  'pl',
  'ch',
  'at',
  'dk',
  'cz',
  'se'];

iosLanguages.forEach((lang) => {
  lastIosIds[lang] = [];
});

function generateMessage(score, user, platform, url, title, text, language, version) {
  const scoreText = ':star:'.repeat(score);
  return `[${scoreText} by **${user}** :${language}: on Version ${version}](${url}): **${title}**\n${text}`;
}

function writeLastIos(language, id) {
  lastIosIds[language].push(id);
  const output = JSON.stringify(lastIosIds, null, 2);
  writeFile(iosIdFile, output, 'utf8', (err) => {
    if (err) throw err;
    console.log(`Written iosIds: ${output} to file!`);
  });
}

function writeLastAndroid(id) {
  lastAndroidIds.push(id);
  writeFile(androidIdFile, JSON.stringify(lastAndroidIds, null, 2), 'utf8', (err) => {
    if (err) throw err;
    console.log(`Added id: ${id} to last Android IDs!`);
  });
}

function sendMessageToWebhook(language, platform, msg) {
  const username = `${platform}-ReviewBot`;
  const iconUrl = `https://github.com/eiselems/eiselems.github.io/blob/images/stuff/${platform}.png?raw=true`;
  // let iconUrl = "http://s415vm1592.detss.corpintra.net/img/" + platform + ".png";
  const queryBody = { text: msg, username, icon_url: iconUrl };
  if (sendRequests) {
    console.log(`Sending out message for ${language} on ${platform}: ${msg}`);
    request({
      url: `${mattermostWebHookUrl}`,
      method: 'POST',
      json: true,
      body: queryBody,
    }, (error, response, body) => {
      if (error) {
        console.log(error);
        throw new Error('Error sending message to webhook. Thanks Mattermost I love you!');
      }
    });
  } else {
    console.log(`Would send out message for ${language} on ${platform}: ${msg}`);
  }
}

async function fetchAndroidReviews() {
  const client = new JWT({
    email: googleClientEmail,
    key: googleClientPrivateKey,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  client.request({ androidUrl }).then((res) => {
    const reviewData = res.data.reviews;
    console.log(reviewData);

    reviewData.forEach((review) => {
      if (lastAndroidIds.includes(review.reviewId)) {
        console.log(`Found already posted review: Skipping ID: ${review.reviewId}`);
        return;
      }
      const { reviewId } = review;
      const author = review.authorName;
      const userReview = review.comments[0].userComment;
      const { text } = userReview;
      const rating = userReview.starRating;
      const fiveDigitLanguage = userReview.reviewerLanguage;
      const version = userReview.appVersionName;
      const href = '';
      const title = '';

      console.log(`${author}: ${rating} -> ${text}`);

      const twoDigitLanguage = fiveDigitLanguage.substring(0, 2);
      const msg = generateMessage(rating, author, androidPlatform, href, title, text, twoDigitLanguage, version);
      try {
        sendMessageToWebhook(twoDigitLanguage, androidPlatform, msg);
        writeLastAndroid(reviewId);
      } catch (error) {
        console.log(`Error writing message Android to webhook (${msg}), trying again next time`);
      }
    });
  })
    .catch((error) => {
      console.log(error);
    });
}

function fetchIosReviewsForLanguage(language) {
  // https://itunes.apple.com/de/rss/customerreviews/id=1029372196/sortBy=mostRecent/json
  const url = `https://itunes.apple.com/${language}/rss/customerreviews/id=${iosAppId}/sortBy=mostRecent/json`;
  request(url, (error, response, body) => {
    console.log('error:', error); // Print the error if one occurred
    if (error) {
      console.log(`Skipping ${language} because of error while fetching JSON`);
      return;
    }
    const jsonBody = JSON.parse(body);
    const latestReview = jsonBody.feed.entry[0];

    const author = latestReview.author.name.label;
    const id = latestReview.id.label;
    const rating = latestReview['im:rating'].label;
    const title = latestReview.title.label;
    const text = latestReview.content.label;
    const { href } = latestReview.link.attributes;
    const version = latestReview['im:version'].label;

    if (lastIosIds[language].includes(id)) {
      console.log(`Skipping IOS because ID is contained in lastIds: ${language}: ${id}`);
    } else {
      console.log('Found new review - gonna report it!');
      const msg = generateMessage(rating, author, 'iOS', href, title, text, language, version);
      try {
        sendMessageToWebhook(language, iosPlatform, msg);
        writeLastIos(language, id);
      } catch (error) {
        console.log(`Error writing IOS message to webhook (${msg}), trying again next time`);
      }
    }
  });
}

console.log(mattermostWebHookUrl);
console.log(iosAppId);

if (!mattermostWebHookUrl
  || !googleClientEmail || !googleClientPrivateKey || !packageNameAndroid
  || !iosAppId
  || !dataDirectory) {
  console.log('Missing an environment variable. Check GOOGLE_CLIENT_EMAIL, GOOGLE_CLIENT_PRIVATEKEY, MM_WEBHOOK_ID, DATA_DIRECTORY, ANDROID_PACKAGENAME, IOS_APPID  ... EXITING');
  process.exit(1);
} else {
  console.log(`Starting Reviewbot, going to send all reviews to Webhook: ${mattermostWebHookUrl}`);
}

function fetchIosReviews() {
  iosLanguages.forEach((language) => {
    fetchIosReviewsForLanguage(language);
  });
}

// probably going to hell for reading files synchronously
try {
  lastIosIds = JSON.parse(readFileSync(iosIdFile, 'utf8'));
  console.log(`Fetched lastIosIds: ${JSON.stringify(lastIosIds)}`);
} catch (err) {
  console.log(`Warn: Error while retrieving lastIos.id: ${err}`);
}

try {
  lastAndroidIds = JSON.parse(readFileSync(androidIdFile, 'utf8'));
  console.log(`Fetched lastAndroidId: ${lastAndroidIds}`);
} catch (err) {
  console.log(`Warn: Error while retrieving lastAndroid.id: ${err}`);
  lastAndroidIds = [];
}

fetchAndroidReviews();
fetchIosReviews();
