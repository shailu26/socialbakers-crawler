var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var FacebookSchema = new Schema({
	rank: Number,
	name: String,
	country: String,
	localfans: String,
	totalfans: String
})


FacebookSchema
  .pre('save', function(next) {
    this.constructor.findOne({name: this.name}, function(err, user){
    	if(err){
    		console.log("error before saving", err);
    		return;
    	}
    	else if(user){
    		var err = new Error('something went wrong');
    		next(err);
    	}
    	else
    		next();		
    });
  });
  
module.exports = mongoose.model('Facebook', FacebookSchema);