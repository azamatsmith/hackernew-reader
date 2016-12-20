const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const inquirer = require('inquirer');
const open = require('open');
const _ = require('lodash');
const axios = require('axios');
const async = require('async');
const API_URL = 'https://hacker-news.firebaseio.com/v0/'; 

var start = 0;
var end = 5;
var thesePosts = [];

function header() {
  console.log(
    chalk.red(
      figlet.textSync('Hacker News', { horizontalLayout: 'full'}) 
    )
  );
  console.log(
    chalk.red(
      figlet.textSync('Reader', { horizontalLayout: 'full'}) 
    )
  );
}

function getPosts() {
  return axios.get(`${API_URL}/topstories.json`).then(res => {
    const posts = res.data.splice(start,end);
    return posts; 
  });
}

function getPostData(postId, callback) {
  axios.get(`${API_URL}/item/${postId}.json`).then(res => {
    const {title, by, url, score} = res.data;
    const newObj = {title, by, url, score}; 
    const str = `${title}  (${url}) - ${score} points`;
    callback(null, newObj);
  });
}

function loadPosts() {
  return getPosts().then((data, err) => {
    if (err) { return console.error(err); }
    return data;
  }).then(data => {
    return async.map(data, getPostData, (err, data) => {
      thesePosts = data;
      initApp();
    });
  });
}

function initApp(err) {
  if (err) {
    return console.log('there was an error starting the program');
  }
  clear();
  header();
  handlePrompt();
}

function handlePrompt() {
  thesePosts.push({title: 'Next 5'});
  if (end !== 5) { thesePosts.push({title: 'Back to Beginning'}) };
  inquirer.prompt([
    { 
      type: 'list', 
      name: 'titles',
      message: 'Select a post to view in your browser',
      paginated: true,
      choices: thesePosts.map((post,i) => {
        if (!post.score) { return `${post.title}`; }
        return `[${i + 1}] ${post.title} -  ${post.score} points`; 
      }),
    } 
  ]).then(({titles}) => {
    let newArr = titles.split(' '); 
    newArr = newArr.splice(1, (newArr.length - 5)).join(' ').trim();
    const index = thesePosts.map(post => post.title).indexOf(newArr);
    if (titles === 'Next 5') {
      thesePosts = [];
      start += 5;
      end += 5; 
      loadPosts();
      return; 
    };
    if (titles === 'Back to Beginning') {
      thesePosts = [];
      start = 0;
      end = 5;
      loadPosts();
      return;
    }
    open(thesePosts[index].url, (err) => {
      thesePosts.pop();
      thesePosts.pop();
      loadPosts();
      return;
    }); 
  });
}

loadPosts(start, end);
