$(function() {
  // Use const instead of var for better scoping
  const text = $(".text");

  // Use arrow function for more concise syntax
  $(window).scroll(() => {
    const scroll = $(window).scrollTop();

    if (scroll >= 200) {
      text.removeClass("hidden");
    } else {
      text.addClass("hidden");
    }
  });
});
