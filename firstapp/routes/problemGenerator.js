const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Configuration, OpenAIApi } = require("openai");
const GPTHistoryItem = require('../models/gptHistoryItem');
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

isLoggedIn = (req, res, next) => {
    if (res.locals.loggedIn) {
        next()
    } else {
        res.redirect('/login')
    }
}

router.get("/problemGenerator", (req, res, next) => {
    res.render('problemGenerator', { title: 'Express' });
})

router.post('/problemGenerator',
    isLoggedIn,
    async (req, res, next) => {
        let prompt = "Now you are a math problems generator. You will generate math problems with the amount and topic specified by users. Below is the user's request:"
            + req.body.request;
        let answer = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: prompt,
            temperature: 1,
            max_tokens: 2048,
            n: 1,
            stop: null,
        })

            .then(result => { return result.data.choices[0].text })
            .catch(error => console.error(error));

        const history = new GPTHistoryItem(
            {
                prompt: req.body.request,
                answer: answer ,
                createdAt: new Date(),
                userId: req.user._id,
            }
        )
        await history.save()
        res.render('problemGptAnswer',{ answer });

    }
)

router.get('/history',
    isLoggedIn,
    async (req, res, next) => {
        let items = await GPTHistoryItem.find({ userId: req.user._id })
        res.render('history', { items })
    }
)

router.get('/history/clear',
    isLoggedIn,
    async (req, res, next) => {
        await GPTHistoryItem.deleteMany({})
        res.render('history', { items: [] })
    }
)

module.exports = router;