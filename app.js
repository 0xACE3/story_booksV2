const path = require('path');
const express = require('express');
const morgan = require('morgan');
const {engine} = require('express-handlebars');
const passport = require('passport');
const session = require('express-session');
 const MongoStore = require('connect-mongo');
const dotenv = require('dotenv');
const  connectDB = require('./config/db');
const methodOverride = require('method-override');



//Config
dotenv.config({path: './config/config.env'});
require('./config/passport')(passport);
const MODE = process.env.NODE_ENV;
connectDB();

const app = express();
app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use(
    methodOverride(function (req, res) {
        if (req.body && typeof req.body === 'object' && '_method' in req.body) {
            // look in urlencoded POST bodies and delete it
            let method = req.body._method
            delete req.body._method
            return method
        }
    })
)

if (MODE === 'development') {
    app.use(morgan('dev'))
}

const {formatDate, stripTags, truncate, editIcon, select} = require('./helpers/hbs');

app.engine('handlebars', engine({defaultLayout: 'main',
    helpers: {formatDate, truncate, stripTags, editIcon, select}}));
app.set('view engine', 'handlebars');

app.use(
    session({
        secret: "abc.xyz",
        resave: false,
        saveUninitialized: false,
        store: new MongoStore({
            mongoUrl: process.env.MONGO_URI,
            collectionName: "sessions",
            ttl:  14 * 24 * 60 * 60,
            autoRemove: "native"
        }),
        cookie: {maxAge: 14 * 24 * 60 * 60}
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use( (req, res, next) => {
    res.locals.user = req.user || null
    next()
})


app.use(express.static(path.join(__dirname, 'public')))

app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'))
app.use('/stories', require('./routes/stories'))

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running in ${MODE} mode on port ${PORT}\nhttp://localhost:${PORT}`));


