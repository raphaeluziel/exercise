$(document).ready(function() {
  
  // A nicer display of user logs than the json one
  $("#getLogs").on("click", function() {
  
    var link = "";
    
    // Get the information from the form
    var i = 1;
    var userId = document.getElementById("userId").value;
    var from = document.getElementById("from").value;
    var to = document.getElementById("to").value;
    var limit = document.getElementById("limit").value;  

    // Create a link to the api that gets all the information 
    // (the one that the server.js returns as a json)
    link = "https://api-uziel-exercise.glitch.me/api/exercise/log?userId=" + userId;
    if (from) {link += "&from=" + from}
    if (to) {link += "&to=" + to}
    if (limit) {link +=  "&limit=" + limit}
    
    // Make the link clickable if user prefers the json format
    document.getElementById("urlGenerated").innerHTML = link;
    document.getElementById("urlGenerated").href = link;
 
    // Get the data and generate a nice looking table of it
    $.getJSON(link, function(json) {
      
      var html;
      
      // If data is received draw the table and populate it with the data
      if (!json.message){
        // Table title with basic information to be displayed
        html = "<p><strong>Activity log for " + json.username + " from " + json.from + " to " + json.to + " limit " + json.count 
          + "</strong></p><table><tr><th>No</th><th>DATE</th><th>ACTIVITY</th><th>DURATION</th></tr>";
        
        // Table display
        json.log.forEach(function(x){
          html += "<tr><td>" + i + "</td><td>" + x.date + "</td><td>" + x.description + "</td><td>" + x.duration + "</td></tr>";
          i += 1;
        })
        $("#activityLog").html(html);
        $("#errorMessage").html("");
      }  
      else{
        $("#errorMessage").html(json.message);
        $("#activityLog").html("");
      }
      
      i = 1;
      html = "";
    });
    
  });
  
  
  // Get a list of all users, but as a nice looking list instead of a json object
  var toggle = -1;
  
  $("#getAllUsers").on("click", function() {
 
    $.getJSON("https://api-uziel-exercise.glitch.me/api/exercise/users", function(json) {
      
      // Toggle showing and hiding the user list
      if (toggle < 0){
        var html = "<ol>";

        // Generate the list
        json.forEach(function(x){
            html += "<li>" + x.username + ": " + x.userId + "</li>";
          })
        html += "</ol>"

        $("#userList").html(html);
      }   
      else{
        $("#userList").html("");
      }
      
      toggle *= -1;
    });
  });
});