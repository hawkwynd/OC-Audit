// -------------------------------------------------------------------------
// Tabs sticky 
// -------------------------------------------------------------------------
var $navbar = $("#tab-nav"),
    y_pos = $navbar.offset().top,
    height = $navbar.height();

$(document).on("scroll", function() {
    var scrollTop = $(this).scrollTop();
    if (scrollTop >= y_pos) {
        !$navbar.hasClass("sticky") && $navbar.addClass("sticky");
    } else if (scrollTop < y_pos) {
        $navbar.removeClass("sticky");
    }
});


// -------------------------------------------------------------------------
// Disable links on imported sites
// -------------------------------------------------------------------------
$(document).ready(function(){
  $("#diff a, #old a, #new a").on('click', function(e){
    e.preventDefault();
  });
  // aos remove
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