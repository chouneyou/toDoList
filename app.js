//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const date=require(__dirname+"/date.js");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://chenyu_1:Test-123@cluster0.eh8y3.mongodb.net/todolistDB",{ 
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    });

mongoose.connection.on('error', console.error.bind(console, 'connection error:')); 

const itemSchema=new mongoose.Schema({
    name:String
});
const Item=mongoose.model("item",itemSchema);

const item1=new Item({
    name:"Welcome to your todolist!"
});
const item2=new Item({
    name:"Hit the + to add items."
})
const item3=new Item({
    name:"<-- Hit it to delete items."
})

const defaultItems = [item1,item2,item3];

const listSchema={
    name:String,
    items:[itemSchema]
};

const List = mongoose.model("List", listSchema);

const day = date.getDay();

app.get("/", function(req, res){

Item.find(function(err,foundItems){
    if (foundItems.length===0){
        Item.insertMany(defaultItems,function(err){
            if(err){console.log(err);}
            else{console.log("successfully insert items.")}
        });
        res.redirect("/");
    } else{
        res.render("list",{listTitle:day,newListItems:foundItems});
    }
});

});

app.get("/:customListName",function(req,res){
    const customListName=_.capitalize(req.params.customListName);
    List.findOne({name:customListName},function(err,foundList){
        if(!err){
            if(!foundList){
                const list = new List({
                    name:customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/"+customListName);
        }else{
            res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
    }
}
    });
});

app.post("/",function(req,res){
    const listItem=req.body.newItem;
    const listName=req.body.list; 
    
    const item=new Item({
        name:listItem
    });
    if (listName===day){
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name:listName},function(err,foundList){
            foundList.items.push(item);
            foundList.save();
                res.redirect("/"+listName);
        });
    }
    
});

app.post("/delete",function(req,res){
    const checkedItemId=req.body.checkbox;
    const listName=req.body.listName;

if(listName===day){
    Item.findByIdAndRemove(checkedItemId,function(err){
        if(err){console.log(err)}else{
            console.log("successfully deleted item.")
        }
        res.redirect("/");
    });
}else{
List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err,foundList){
    if(!err){
        res.redirect("/"+listName);
    } else{
        console.log(err);
    }
});
}
});

app.listen(process.env.PORT || 3000, function(){
    console.log("Express server listening on port");
  });
