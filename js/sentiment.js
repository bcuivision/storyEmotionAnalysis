

const settings = {
	"async": true,
	"crossDomain": true,
	"url": "https://text-sentiment.p.rapidapi.com/analyze",
	"method": "POST",
	"headers": {
		"content-type": "application/x-www-form-urlencoded",
		"X-RapidAPI-Key": "cd78e348d2msh8591b3ea45b071ep1b08c9jsn3be66b6c5d37",
		"X-RapidAPI-Host": "text-sentiment.p.rapidapi.com"
	},
	"data": {
		"text": "hate"
	}
};

$.ajax(settings).done(function (response) 
{
	console.log(JSON.parse(response));
});