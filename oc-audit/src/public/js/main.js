// -------------------------------------------------------------------------
// Tabs sticky 
// -------------------------------------------------------------------------
window.onscroll = function() {myFunction()};

var navbar = document.getElementById("tab-nav");
var sticky = navbar.offsetTop;

function myFunction() {
  if (window.pageYOffset >= sticky) {
    navbar.classList.add("sticky");
  } else {
    navbar.classList.remove("sticky");
  }
}

// -------------------------------------------------------------------------
// Disable links on imported sites
// -------------------------------------------------------------------------
$(document).ready(function(){
  $("#diff a, #old a, #new a").on('click', function(e){
    e.preventDefault();
  });
});

// -------------------------------------------------------------------------
// Back script
// -------------------------------------------------------------------------
$(document).ready(function(){
  if($(".back")) {
    $("back").on('click', function(e){
      window.history.back();
    });
  }
});