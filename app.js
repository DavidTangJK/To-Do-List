//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");

const app = express();

const _ = require("lodash");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://dtang:" + process.env.password + "@cluster0.e8eunzd.mongodb.net/?retryWrites=true&w=majority", {
  useNewUrlParser: true
});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const code = new Item({
  name: "Study code"
});

const take = new Item({
  name: "Take a break!"
});

const eat = new Item({
  name: "Time to eat!"
});

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

const defaultItems = [code, take, eat];


app.get("/", function(req, res) {
  Item.find(function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Add items Successfully");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });

});

app.get("/:siteName", function(req, res) {
  let todoTitle = _.capitalize(req.params.siteName);

  List.findOne({
    name: todoTitle
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: todoTitle,
          items: defaultItems
        })
        list.save();
        res.redirect("/" + todoTitle);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  })

});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res) {

  const itemChecked = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(itemChecked, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Deleted item.");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemChecked}}}, function(err, foundList){
      if (err) {
        console.log(err);
      } else {
        res.redirect("/" + listName);
      }
    });

  }



});


app.get("/about", function(req, res) {
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);
