var express = require('express');
var sgMail = require('@sendgrid/mail');
var axios = require('axios');
var router = express.Router();
var Mail = require('../model/mail');
var Visitor = require('../model/visitor');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.get('/mails', function(req, res, next) {
    Mail.find({}, function (err, mailers) {
        if (err) {
            return res.status(500).json({messages: 'Get Mailers Error', error: err})
        }
        res.render('mailers', {mailers: mailers})
    });
});

router.get('/visitors', function(req, res, next) {
    Visitor.find({}, function (err, visitors) {
        if (err) {
            return res.status(500).json({message: 'Get Visitors Error', error: err})
        };
        res.render('visitors', {visitors: visitors})
    });
});

router.get('/fetchVisitor', function(req, res, next) {
    Visitor.find({}, function (err, visitors) {
        if (err) {
            return res.status(500).json({message: 'Get Visitors Error', error: err})
        };
        res.status(200).json({visitors});
    });
});

router.post('/addContact', function(req, res, next) {
    const msg = {
        to: 'jame.bond0523@gmail.com',
        from: req.body.mail.email,
        subject: 'Contact US',
        text: req.body.mail.message
    };

    sgMail
    .send(msg)
    .then((response) => {
        var newMail = new Mail({
            sender_name: req.body.mail.name,
            email: req.body.mail.email,
            phone: req.body.mail.number,
            message: req.body.mail.message
        });
    
        newMail.save(function(err) {
            if (err) {
                return res.status(500).json({ message: 'Add Mail Error', error: err });
            }
            res.status(200).json({ message: 'Mail saved successfully!', response: response });
        })
    }, console.error);
});

router.post('/addVisitor', function(req, res, next) {
    // const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ip = '59.45.63.242';
    const { name } = req.body;
    
    getAddress(ip).then(response => {
        if (response.status) {
            const {country, state, city} = response.data;
            const message = `IP: ${ip}, Country: ${country}, State: ${state}, City: ${city}`;

            const msg = {
                to: 'jame.bond0523@gmail.com',
                from: 'admin@admin.com',
                subject: 'Visitor',
                text: message
            };

            sgMail
            .send(msg)
            .then((response) => {
                var newVisitor = new Visitor({
                    ip: ip,
                    country: country,
                    state: state,
                    city: state,
                    name: name
                });
            
                newVisitor.save(function(err) {
                    if (err) {
                        return res.status(500).json({ message: 'Add Visitor Error', error: err });
                    }
                    res.status(200).json({ message: 'Visitor saved successfully!', response: response });
                })
            }, console.error);
        }
    })
});

router.delete('/', function(req, res) {
    Visitor.remove({}, function(err, data) {
        if (err)
            return res.status(500).json({ message: 'Error', error: err });

        res.status(200).json({});
    });
});

// router.delete('/', function(req, res) {
//     TrackContent.remove({}, function(err, data) {
//         if (err)
//             return res.status(500).json({ message: 'Error', error: err });

//         res.status(200).json({});
//     });
// });

const getAddress = (ip) => {
    return new Promise((resolve) => 
        {
            const url = `http://www.geoplugin.net/json.gp?ip=${ip}`;
            axios.get(url)
            .then( response => { 
                return resolve({
                    status: true,
                    data: {
                        country: response.data.geoplugin_countryName,
                        city: response.data.geoplugin_city,
                        state: response.data.geoplugin_regionName
                    }
                });
            } )
            .catch( response => {
                return resolve({
                    status: false
                })
            } );
        }
    );
};

module.exports = router;