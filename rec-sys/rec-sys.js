Movies = new Mongo.Collection('movies');
Ratings = new Mongo.Collection('ratings');/*
Recommend = new Mongo.Collection('recommend');*/
rectitle = "";

if (Meteor.isClient) {

  Meteor.subscribe("movies");
  Meteor.subscribe("ratings");/*
  Meteor.subscribe("recommend");*/

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
  
  Template.body.helpers({
    movies: function() {
      if(Session.get('type') == 'ratedMovies') {
        return Ratings.find({user: Meteor.user().username}, {sort: {title:1}})
      } 
      else if(Session.get('type') == 'unratedMovies') {

          var arr = [];
          var count = Ratings.find({user: Meteor.user().username}).count();
          var i =0;
          var date = new Date(2014,0,1);

          for (var i = 0; i < count; i++) {
            var rate = Ratings.findOne({user:Meteor.user().username, createdAt: {$gt : date}});
            arr.push(rate.title);
            date = rate.createdAt;
          };
          return Movies.find({title: {$nin: arr}}, {sort: {title:1}});
      } 
      else if(Session.get('type') == 'popularMovies') {
        return Movies.find({avgRating: {$gt:0}}, {sort: {avgRating: -1}, limit: 2});
      }
      else if(Session.get('type') == 'genreMovies') {
        var favGenreCount = 0;
        var favGenre;
        var genres = ['Action','Animation','Comedy', 'Drama', 'Horror','Romance', 'Thriller', 'Sci-Fi'];
        var genrecount = [0,0,0,0,0,0,0,0];
        var date = new Date(2014,0,1);
        var arr = [];
        for (var i = 0; i < Ratings.find({user:Meteor.user().username}).count(); i++) {
          var rate = Ratings.findOne({user:Meteor.user().username, createdAt: {$gt : date}});
          arr.push(rate.title);
          date = rate.createdAt;
        };
        date = new Date(2014,0,1);
        for (var i = 0; i < genres.length; i++) {
          for (var j = 0; j < arr.length; j++) {
            if(Movies.find({title: {$in: arr}, genre: genres[i], createdAt: {$gt : date}}).count() > 0) { 
              var mov = Movies.findOne({title: {$in: arr}, genre: genres[i], createdAt: {$gt : date}});
              genrecount[i] += parseInt(Ratings.findOne({user:Meteor.user().username, title:mov.title}).rating);
              date = mov.createdAt;
            }
          };
          date = new Date(2014,0,1);;
        };
        for (var i = 0; i < genres.length; i++) {
          genrecount[i] = genrecount[i] / Movies.find({title: {$in: arr}, genre: genres[i], createdAt: {$gt : date}}).count()
        };
        for (var i = 0; i < genres.length; i++) {
          if(genrecount[i] > favGenreCount) {
            favGenre = genres[i];
            favGenreCount = genrecount[i];
          }
        };
        return Movies.find({title: {$nin :arr}, avgRating: {$gt: 0}, genre: favGenre},{sort: {avgRating:-1},limit:2});
      }
      else if(Session.get('type') == 'itemitemMovies') {
        if(Movies.find({title: rectitle}).count() > 0) {
          var targetmovie = Movies.findOne({title: rectitle});
          var date = new Date(2014,0,1);
          var movies = [];
          for (var i = 0; i < Movies.find().count() - 1; i++) {
            var current = Movies.findOne({title: {$ne: rectitle},createdAt: {$gt : date}});
            date = current.createdAt;
            movies.push(current);
          };
          var users = [];
          var date = new Date(2014,0,1);
          var x = 0;
          for (var i = 0; i < Ratings.find().count() ; i++) {
            x = 0;
            var current = Ratings.findOne({createdAt: {$gt : date}});
            date = current.createdAt;
            for (var j = 0; j < users.length; j++) {
              if(users[j] == current.user) {
                x=1;
              }
            };
            if(x==0) {
              users.push(current.user);
            }
          };
          var averages = new Array(users.length);
          for (var i = 0; i < averages.length; i++) {
            averages[i] = new Array(2);
            averages[i][0] = users[i];
          };
          var date = new Date(2014,0,1);
          var count = 0;
          for (var i = 0; i < averages.length; i++) {
            count = 0;
            for (var j = 0; j < Ratings.find({user: users[i]}).count(); j++) {
              count += parseInt(Ratings.findOne({user:users[i] ,createdAt: {$gt : date}}).rating);
              date = Ratings.findOne({user:users[i] ,createdAt: {$gt : date}}).createdAt;
            };
            count = count / Ratings.find({user: users[i]}).count();
            averages[i][1] = count;
          };
          var value = 0;
          var returnmovies = [];
          var best = -2;
          var nom = 0;
          var denom1 = 0;
          var denom2 = 0;
          for (var i = 0; i < movies.length; i++) {
            for (var j = 0; j < users.length; j++) {
              if (Ratings.find({title: targetmovie.title, user: users[j]}).count() > 0 && Ratings.find({title: movies[i].title, user: users[j]}).count() > 0) {
                nom += (Ratings.findOne({title: movies[i].title, user: users[j]}).rating - averages[j][1]) 
                  * (Ratings.findOne({title: targetmovie.title, user: users[j]}).rating - averages[j][1]);
                denom1 += (Ratings.findOne({title: movies[i].title, user: users[j]}).rating - averages[j][1]) 
                  * (Ratings.findOne({title: movies[i].title, user: users[j]}).rating - averages[j][1]);
                denom2 += (Ratings.findOne({title: targetmovie.title, user: users[j]}).rating - averages[j][1])
                  * (Ratings.findOne({title: targetmovie.title, user: users[j]}).rating - averages[j][1]);
              };
            };
            value = nom / (Math.sqrt(denom1) * Math.sqrt(denom2));
            if(value >= 0.5) {
              returnmovies.push(movies[i].title);
            }
            nom = 0;
            denom1 = 0;
            denom2 = 0;
          };
          return Movies.find({title: {$in : returnmovies}});
        }
        else {
          swal("Error", rectitle + " does not exist", "error")
          Session.set('type', 'itemitemMoviesnr');
        }
      }
      else {
        return Movies.find({},{sort :{title:1}});
      }
    },
    isAdmin: function() {
      if(Meteor.user() != null) {
        return Meteor.user().username == "admin";
      }
      return false; 
    },
    ratedMovies: function() {
      return Session.get('type') == 'ratedMovies';
    },
    unratedMovies: function() {
      return Session.get('type') == 'unratedMovies';
    },
    popularMovies: function() {
      return Session.get('type') == 'popularMovies';
    },
    allMovies: function() {
      return Session.get('type') == 'allMovies' || Session.get('type') == undefined;
    },
    genreMovies: function() {
      return Session.get('type') == 'genreMovies';
    },
    itemitemMoviesnr: function() {
      return Session.get('type') == 'itemitemMoviesnr';
    },
    itemitemMovies: function() {
      return Session.get('type') == 'itemitemMovies';
    },
    isUser: function() {
      return Meteor.user() != null;
    }
  });


  Template.body.events({
    'submit .new-movie': function(event) {
      var title = event.target.title.value;
      if(Movies.find({title:title}).count() > 0) {
        swal("Error", title + " already exists", "error");
      }
      else if(title == "") {
        swal("Error", "Please enter title", "error");
      }
      else if(!document.getElementById("an").checked && !document.getElementById("a").checked && !document.getElementById("c").checked 
        && !document.getElementById("h").checked && !document.getElementById("t").checked && !document.getElementById("d").checked
         && !document.getElementById("r").checked && !document.getElementById("sf").checked) {
        swal("Error", "No genre entered", "error");
      } else {
        var genre = [];
        if(document.getElementById("c").checked == true) {
        genre.push("Comedy");      
        document.getElementById("c").checked = false; 
        }
        if(document.getElementById("a").checked == true) {
          genre.push("Action");
          document.getElementById("a").checked = false; 
        }
        if(document.getElementById("t").checked == true) {
          genre.push("Thriller");
          document.getElementById("t").checked = false; 
        }
        if(document.getElementById("r").checked == true) {
          genre.push("Romance");
          document.getElementById("r").checked = false; 
        }
        if(document.getElementById("d").checked == true) {
          genre.push("Drama");
          document.getElementById("d").checked = false; 
        }
        if(document.getElementById("h").checked == true) {
          genre.push("Horror");
          document.getElementById("h").checked = false; 
        }
        if(document.getElementById("an").checked == true) {
          genre.push("Animation"); 
          document.getElementById("an").checked = false; 
        }
        if(document.getElementById("sf").checked == true) {
          genre.push("Sci-Fi"); 
          document.getElementById("sf").checked = false; 
        }

        Meteor.call("addMovie", title, genre);
        event.target.title.value="";
      }
        return false;
    },
    'change .rated-movies': function(event){
      Session.set('type', 'ratedMovies');
    },
    'change .unrated-movies': function(event){
      Session.set('type', 'unratedMovies');
    },
    'change .popular-movies': function(event){
      Session.set('type', 'popularMovies');
    },
    'change .all-movies': function(event) {
      Session.set('type', 'allMovies');
    },
    'change .genre-movies': function(event) {
      Session.set('type', 'genreMovies');
    },
    'change .item-item-movies': function(event) {
      Session.set('type', 'itemitemMoviesnr');/*
      Meteor.call("emptyRecommend");*/
    },
    'submit .recommend': function(event) {
      var title = event.target.title.value;
      rectitle = title;
      Session.set('type', 'allMovies');
      Session.set('type', 'itemitemMovies');/*
      Meteor.call("emptyRecommend");
      Meteor.call("addRecommend", title);*/
      return false; 
    }
  });

  Template.movie.events({
    'click .delete': function() {
      var title = this.title;
      Meteor.call("deleteMovie", this._id,title);
      return false;
    },

    'submit .rate': function(event) {
      var rating = event.target.rating.value;
      var title = this.title;
      var user = Meteor.user().username;

      Meteor.call("addRating", rating, title, user);
      event.target.rating.value="";
      return false;
    },
    'click .deleteRate': function() {
      var title = this.title;
      Meteor.call("deleteRating", title, Meteor.user().username);
      return false;
    }
  });

  Template.movie.helpers({
    rated: function() {
      if(Meteor.user() !=null) {
        return Ratings.find({title: this.title, user: Meteor.user().username}).count() > 0;
      } else {
        return false;
      }
    },

    rate: function() {
      return Ratings.findOne({title: this.title, user: Meteor.user().username}).rating;
    },
    isAdmin: function() {
      if(Meteor.user() != null) {
        return Meteor.user().username == "admin";
      }
      else {
        Session.set('type', 'allMovies');
        return false;  
      }
      
    },
    averageRating: function() {
      var current = Ratings.find({title: this.title, rating: "1"}).count();
      current = current + Ratings.find({title: this.title, rating: "2"}).count() * 2;
      current = current + Ratings.find({title: this.title, rating: "3"}).count() * 3;
      current = current + Ratings.find({title: this.title, rating: "4"}).count() * 4;
      current = current + Ratings.find({title: this.title, rating: "5"}).count() * 5;
      current = current / Ratings.find({title: this.title}).count();
      current *= 100;
      current = Math.round(current);
      current = current/100;
      Meteor.call("addAvgRating",current, this._id);
     return current;
    },
    isUser: function() {
      return Meteor.user() != null;
    },
    getGenre: function() {
      return Movies.findOne({title:this.title}).genre;
    }
  });
   
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  Meteor.publish("movies", function() {
    return Movies.find();
  });

  Meteor.publish("ratings", function() {
    return Ratings.find();
  });/*
  Meteor.publish("recommend", function() {
    return Recommend.find();
  });*/
}

Meteor.methods({
  addMovie: function(title, genre) {
    /*if(Movies.find({title: title}).count() == 0) {*/
      Movies.insert({
        title:title,
        avgRating: 0,
        genre:genre,
        createdAt: new Date()
      });
  },

  deleteMovie: function(id, title) {
      Movies.remove(id);
      Ratings.remove({title: title});
  },

  addRating:function(rating, movie, user) {
    Ratings.insert({
      title: movie,
      rating: rating,
      user: user,
      createdAt: new Date()
    });
    
  },
  addAvgRating: function(rating,id) {
    Movies.update(id, {$set: {avgRating :rating}});
  },
/*  addGenre: function(title, genre) {
    Genre.insert({
      title: title,
      genre: genre
    });
  },*/
  deleteRating: function(title,user) {
    Ratings.remove({title:title, user:user});
  }/*,
  addRecommend: function(title) {
    Recommend.insert({
      title:title,
      createdAt: new Date()
    });
  },
  emptyRecommend: function() {
    Recommend.remove({});
  }*/
});
