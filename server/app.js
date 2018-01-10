'use strict';

import mongoose from 'mongoose'
import http from 'http'
import config from './config'
import request from 'request'
import cheerio from 'cheerio'
import Facebook from './model/facebook'
import Youtube from './model/youtube'
import express from 'express'
import path from 'path'

var port = process.env.PORT || 8080;

// App Setup
var app = express();

mongoose.connect(config.all.mongo.uri);

mongoose.connection.on('error', (err) => {
	console.log(err);
	process.exit(0);
});

mongoose.connection.on('connected', () => {
	console.log(`connected to db: ${config.all.mongo.uri}`)
});


app.listen(port,()=>{
	console.log("listening on port", port);
});

app.get('/',(req, res)=>{
	res.sendFile(path.join(__dirname+'/public/index.html'));
})

app.get('/statistics/facebook/', (req, res)=>{
	res.sendFile(path.join(__dirname+'/public/facebook.html'));
})

app.get('/statistics/youtube/', (req, res)=>{
	res.sendFile(path.join(__dirname+'/public/youtube.html'));
})

// return Facebook Statistic data based on Rank
const fbpages = (req, res) => {
	let page;
	let limit;
	if(req.query.hiddenUrl !== 'undefined'){
		limit = parseInt(req.query.limit) + 10;
		page = 'https://www.socialbakers.com/statistics/facebook/pages/local/india/'+ req.query.hiddenUrl+ '/';
	}
	else{
		page = 'https://www.socialbakers.com/statistics/facebook/pages/local/india/';
		limit = 10;
	}
	let data = [];
	request(page, (err, response, body) => {
		if (err) {
			console.log(err);
		}
		console.log(`response code is ${response.statusCode}`);
		const $ = cheerio.load(body);
		$('.brand-table-list tr').each(function(){
			//To get totalfans remove span tag and class element 
			$(this).find('.name').next().next().find('span').remove();
			$(this).find('.name').next().next().find('.table-legend').remove();
			///////////////////////////////////////////////////////////////////
			var name = $(this).find('.name > .item a > h2 .show-name').text()
			if(name !== ""){
				data.push({"rank":parseInt($(this).find('.item-count-td').text().trim()) ,"name": $(this).find('.name > .item a > h2 .show-name').text().trim(), "country": $(this).find('.name > .item a > h2 .show-country').text().trim(), "localfans": $(this).find('.name').next().children().find('strong').text().trim(), "totalfans": $(this).find('.name').next().next().text().trim()});
			}
		});
		let temp;
		let promise = new Promise((resolve, reject) => {
			let count = 0;
			data.forEach((element, index)=>{
				temp = new Facebook(element);
				temp.save((error,savedFb)=>{
					if(error) {
						// reject()
						console.log("Error in saving ",temp.name," ",error.message);
					}
					count++;
					if(count === 10) {
						resolve();
					}
				});
			});
		});
		
		promise.then(() => {
			let showmoreLink = $('.more-center-link').find('a').attr('href');
			let q = Facebook.find({}, '-_id -__v');
			q.sort('rank').limit(limit);
			q.exec((err, fbdata)=>{
				if(err)
					console.log("error finding in db", err);
			}).then((fbdata) => {
				return res.status(200).json({"data": fbdata, "showmoreLink": showmoreLink, "limit": limit});
			})
		})
	})
}

// return Youtube Statistic data based on Rank
const youtubepages = (req, res) => {
	let page;
	let limit;
	if(req.query.hiddenUrl !== 'undefined'){
		limit = parseInt(req.query.limit) + 10;
		page = 'https://www.socialbakers.com/statistics/youtube/channels/india/'+ req.query.hiddenUrl+ '/';
	}
	else{
		page = 'https://www.socialbakers.com/statistics/youtube/channels/india/';
		limit = 10;
	}
	let data = [];
	request(page, (err, response, body) => {
		if (err) {
			console.log(err);
		}
		console.log(`response code is ${response.statusCode}`);
		const $ = cheerio.load(body);
		$('.brand-table-list tr').each(function(){
			// to get total upload video views,remove span tag and class element
			$(this).find('.name').next().next().find('span').remove();
			$(this).find('.name').next().next().find('.table-legend').remove();
			////////////////////////////////////////////////////////////////////
		  // to get subscriber detail
		  $(this).find('td').last().prev().find('span').remove();
		  $(this).find('td').last().prev().find('.table-legend').remove();
		  ///////////////////////////////////////////////////////////////////

			var name = $(this).find('.name > .item a > h2 span').text()
			if(name !== ""){
				data.push({"rank":parseInt($(this).find('.item-count-td').text().trim()) ,"name": $(this).find('.name > .item a > h2 span').text().trim(), "subscriber": $(this).find('td').last().prev().text().trim(), "totalviews": $(this).find('.name').next().next().text().trim()});
			}
		});
		let temp;
		let promise = new Promise((resolve, reject) => {
			let count = 0;
			data.forEach((element, index)=>{
				temp = new Youtube(element);
				temp.save((error,savedFb)=>{
					if(error) {
						// reject()
						console.log("Error in saving ",temp.name," ",error.message);
					}
					count++;
					if(count === 10) {
						resolve();
					}
				});
			});
		});
		
		promise.then(() => {
			let showmoreLink = $('.more-center-link').find('a').attr('href');
			let q = Youtube.find({}, '-_id -__v');
			q.sort('rank').limit(limit);
			q.exec((err, youtubedata)=>{
				if(err)
					console.log("error finding in db", err);
			}).then((youtubedata) => {
				return res.status(200).json({"data": youtubedata, "showmoreLink": showmoreLink, "limit": limit});
			})
		})
	})
}

app.get('/getfbData',(req,res)=>{
	fbpages(req, res);	
});

app.get('/getyoutubeData',(req,res)=>{
	youtubepages(req, res);	
});

//The 404 Route (ALWAYS Keep this as the last route)
app.get('*',(req, res)=>{
  res.sendFile(path.join(__dirname+'/public/notfound.html'));
});