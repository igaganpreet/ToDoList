const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");

mongoose.set('useFindAndModify', false);
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect('mongodb://localhost:27017/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true});

var Schema = mongoose.Schema;
const itemsSchema=new Schema({
name:{
  type:String,
  required: true
}
});

const Item=mongoose.model("Item", itemsSchema);

const item1= new Item({
  name:"Do #100DaysOfCode challenge"
});
const item2= new Item({
  name:"Tweet the progress"
});
const item3= new Item({
  name:"Do some exercise"
});

const defaultItems=[item1, item2, item3];

const listSchema=new Schema({
  name:{
    type:String,
    required: true
  },
  items:[itemsSchema]
  });
  const List=mongoose.model("List", listSchema);

app.get("/", function(req,res){
  
  Item.find({},function (err, foundItems) {
    
    if(foundItems.length===0){
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }
        else{
          console.log("successfully inserted defalt items to DB.");
        }
        });
        res.redirect("/");
    }
    
    else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
 
});

app.get("/:customListName",function(req,res){
  const customListName= _.capitalize(req.params.customListName) ;
  List.findOne({name:customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        // create new list
        const list=new List({
        name:customListName,
        items:defaultItems
      });
        list.save();
        res.redirect("/"+customListName);
      }
      else{
        // show existing list
        res.render("list", {listTitle: customListName, newListItems: foundList.items});
      }
    }
  });
});


app.post("/", function(req, res){

    const itemName = req.body.newItem;
    const listName=req.body.list;

    const item= new Item({
      name:itemName
    });
    
    if(listName=="Today")
      {
        item.save();
        res.redirect("/");
      }    
    else{
        List.findOne({name:listName},function(err,foundList){
          foundList.items.push(item);
          foundList.save();
          res.redirect("/"+listName);
        })
      }
    }
);



app.post("/delete",function(req,res){
  const checkedItemID=req.body.checkBox ;
  const listName=req.body.listName;

  if(listName=="Today"){
    Item.findByIdAndRemove(checkedItemID , function (err) {
      if(err){
        console.log(err);
      }
      else{
        console.log("Deleted successfully");
        res.redirect("/");
      }
    });
  }
  else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{ _id:checkedItemID}}},function (err,foundList){
      if(!err){
        res.redirect("/"+listName);
      }
      else{
        console.log(err);
      }
    }  
    );
  }
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
