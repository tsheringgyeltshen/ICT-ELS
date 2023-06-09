$(function () {
  "use strict";

  //------- Parallax -------//
  skrollr.init({
    forceHeight: false
  });

  //------- Active Nice Select --------//
  $('select').niceSelect();

  //------- hero carousel -------//
  $(".hero-carousel").owlCarousel({
    items: 3,
    margin: 10,
    autoplay: false,
    autoplayTimeout: 5000,
    loop: true,
    nav: false,
    dots: false,
    responsive: {
      0: {
        items: 1
      },
      600: {
        items: 2
      },
      810: {
        items: 3
      }
    }
  });

  //------- Best Seller Carousel -------//
  if ($('.owl-carousel').length > 0) {
    $('#bestSellerCarousel').owlCarousel({
      loop: true,
      margin: 30,
      nav: true,
      navText: ["<i class='ti-arrow-left'></i>", "<i class='ti-arrow-right'></i>"],
      dots: false,
      responsive: {
        0: {
          items: 1
        },
        600: {
          items: 2
        },
        900: {
          items: 3
        },
        1130: {
          items: 4
        }
      }
    })
  }

  //------- single product area carousel -------//
  $(".s_Product_carousel").owlCarousel({
    items: 1,
    autoplay: false,
    autoplayTimeout: 5000,
    loop: true,
    nav: false,
    dots: false
  });

  //------- mailchimp --------//  
  function mailChimp() {
    $('#mc_embed_signup').find('form').ajaxChimp();
  }
  mailChimp();

  //------- fixed navbar --------//  
  $(window).scroll(function () {
    var sticky = $('.header_area');
    var scroll = $(window).scrollTop();
    var windowHeight = $(window).height();
    var threshold = windowHeight * 0.3;

    if (scroll >= threshold) {
      sticky.addClass('fixed');
    }
    else {
      sticky.removeClass('fixed');
    }
  });

  //------- Price Range slider -------//
  if (document.getElementById("price-range")) {

    var nonLinearSlider = document.getElementById('price-range');

    noUiSlider.create(nonLinearSlider, {
      connect: true,
      behaviour: 'tap',
      start: [500, 4000],
      range: {
        // Starting at 500, step the value by 500,
        // until 4000 is reached. From there, step by 1000.
        'min': [0],
        '10%': [500, 500],
        '50%': [4000, 1000],
        'max': [10000]
      }
    });


    var nodes = [
      document.getElementById('lower-value'), // 0
      document.getElementById('upper-value')  // 1
    ];

    // Display the slider value and how far the handle moved
    // from the left edge of the slider.
    nonLinearSlider.noUiSlider.on('update', function (values, handle, unencoded, isTap, positions) {
      nodes[handle].innerHTML = values[handle];
    });

  }
  var proQty = $('.pro-qty');
  proQty.prepend('<span class="dec qtybtn">-</span>');
  proQty.append('<span class="inc qtybtn">+</span>');
  proQty.on('click', '.qtybtn', function () {
    var $button = $(this);
    var oldValue = $button.parent().find('input').val();
    if ($button.hasClass('inc')) {
      var newVal = parseFloat(oldValue) + 1;
    } else {
      // Don't allow decrementing below zero
      if (oldValue > 0) {
        var newVal = parseFloat(oldValue) - 1;
      } else {
        newVal = 0;
      }
    }
    $button.parent().find('input').val(newVal);
  });

  // Number of cards to display per page


});

$(document).ready(function () {
  var table = $('#example').DataTable({
    fixedHeader: true,
    order: [],
    sortable: false,
    headerCallback: function (thead, data, start, end, display) {
      $(thead).find('th').css('background-color', 'rgba(0, 35, 71, 0.980392)');
      $(thead).find('th').css('color', 'white');
    }
  });
});
$(document).ready(function () {
  $(".description-toggle").click(function (e) {
    e.preventDefault();
    $(".description-more").toggleClass("show");
    $(this).text(function (_, text) {
      return text === "See More" ? "See Less" : "See More";
    });
  });
});




