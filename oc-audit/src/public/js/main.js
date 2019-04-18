// -------------------------------------------------------------------------
// Tabs sticky 
// -------------------------------------------------------------------------
var navbar = document.getElementById("tab-nav");

window.onscroll = function() {myFunction()};

var sticky = navbar && navbar.offsetTop;

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
  // aos
  $("*[data-aos]").removeAttr('data-aos');
});

// -------------------------------------------------------------------------
// Back script
// -------------------------------------------------------------------------
$(document).ready(function(){
    $("back").on('click', function(e){
      e.preventDefault();
      window.history.back();
    });
});