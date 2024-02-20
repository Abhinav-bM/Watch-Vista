(function($) {
  
  "use strict";

  // Preloader
    function stylePreloader() {
      $('body').addClass('preloader-deactive');
    }

  // Background Image Js
    const bgSelector = $("[data-bg-img]");
    bgSelector.each(function (index, elem) {
      let element = $(elem),
        bgSource = element.data('bg-img');
      element.css('background-image', 'url(' + bgSource + ')');
    });

  // Background Color Js
    const Bgcolorcl = $("[data-bg-color]");
    Bgcolorcl.each(function (index, elem) {
      let element = $(elem),
        Bgcolor = element.data('bg-color');
      element.css('background-color', Bgcolor);
    });

  // Offcanvas Nav Js
    var $offcanvasNav = $("#offcanvasNav a");
    $offcanvasNav.on("click", function () {
      var link = $(this);
      var closestUl = link.closest("ul");
      var activeLinks = closestUl.find(".active");
      var closestLi = link.closest("li");
      var linkStatus = closestLi.hasClass("active");
      var count = 0;

      closestUl.find("ul").slideUp(function () {
        if (++count == closestUl.find("ul").length)
          activeLinks.removeClass("active");
      });

      if (!linkStatus) {
        closestLi.children("ul").slideDown();
        closestLi.addClass("active");
      }
    });

  // Menu Activeion Js
    var cururl = window.location.pathname;
    var curpage = cururl.substr(cururl.lastIndexOf('/') + 1);
    var hash = window.location.hash.substr(1);
    if((curpage === "" || curpage === "/" || curpage === "admin") && hash === "")
      {
      } else {
        $(".header-navigation-area li").each(function()
      {
        $(this).removeClass("active");
      });
      if(hash != "")
        $(".header-navigation-area li a[href='"+hash+"']").parents("li").addClass("active");
      else
      $(".header-navigation-area li a[href='"+curpage+"']").parents("li").addClass("active");
    }

  // Swiper Default Slider Js
    var mainlSlider = new Swiper('.default-slider-container', {
      slidesPerView : 1,
      slidesPerGroup: 1,
      loop: true,
      speed: 700,
      spaceBetween: 0,
      effect: 'fade',
      autoHeight: true, //enable auto height
      fadeEffect: {
          crossFade: true,
      },
      navigation: {
        nextEl: '.default-slider-container .swiper-btn-next',
        prevEl: '.default-slider-container .swiper-btn-prev',
      },
    });

  // Product Single Thumb Slider Js
    var ProductNav = new Swiper('.single-product-nav-slider', {
      spaceBetween: 20,
      slidesPerView: 3,
      mousewheel: {
        invert: true,
      },
      navigation: {
        nextEl: '.product-single-swiper-wrap .swiper-btn-next',
        prevEl: '.product-single-swiper-wrap .swiper-btn-prev',
      },
    });
    var ProductThumb = new Swiper('.single-product-thumb-slider', {
      effect: 'fade',
      mousewheelControl: true,
      fadeEffect: {
        crossFade: true,
      },
      thumbs: {
        swiper: ProductNav,
      }
    });

  // Testimonial Slider Js
    var testimonialSlider = new Swiper('.testimonial-slider-container', {
      slidesPerView : 3,
      slidesPerGroup: 1,
      allowTouchMove: false,
      spaceBetween: 30,
      speed: 600,
      effect: 'fade',
      fadeEffect: {
          crossFade: true,
      },
      breakpoints: {
        1200: {
          slidesPerView : 3,
          spaceBetween: 30,
        },
        992: {
          slidesPerView : 1,
          spaceBetween: 30,
        },
        0: {
          slidesPerView : 1,
          spaceBetween: 30,
          allowTouchMove: true,
        },
      }
    });

  // Fancybox Js
    $('.image-popup').fancybox();
    $('.video-popup').fancybox();

  // Product Quantity JS
    var proQty = $(".pro-qty");
    proQty.append('<div class= "dec qty-btn">-</div>');
    proQty.append('<div class="inc qty-btn">+</div>');
    $('.qty-btn').on('click', function (e) {
      e.preventDefault();
      var $button = $(this);
      var oldValue = $button.parent().find('input').val();
      if ($button.hasClass('inc')) {
        var newVal = parseFloat(oldValue) + 1;
      } else {
        // Don't allow decrementing below zero
        if (oldValue > 1) {
          var newVal = parseFloat(oldValue) - 1;
        } else {
          newVal = 1;
        }
      }
      $button.parent().find('input').val(newVal);
    });

  // Countdown Js 
    $(".ht-countdown").each(function(index, element) {
      var $element = $(element),
      $date = $element.data('date');
      $element.countdown($date, function(event) {
        var $this = $(this).html(event.strftime(''
        +
        '<div class="countdown-item"><span class="countdown-item__time">%D</span><span class="countdown-item__label">days</span></div>' +
        '<div class="countdown-item"><span class="countdown-item__time">%H</span><span class="countdown-item__label">Hours</span></div>' +
        '<div class="countdown-item"><span class="countdown-item__time">%M</span><span class="countdown-item__label">Mins</span></div>' +
        '<div class="countdown-item"><span class="countdown-item__time">%S</span><span class="countdown-item__label">Secs</span></div>'));
      });
    });

  // Price Range
    $(".js-range-slider").ionRangeSlider({
      skin: "round",
      hide_min_max: true,    // show/hide MIN and MAX labels
      prefix: "$",
    });

  // Ajax Contact Form JS
    var form = $('#contact-form');
    var formMessages = $('.form-message');

    $(form).submit(function(e) {
      e.preventDefault();
      var formData = form.serialize();
      $.ajax({
        type: 'POST',
        url: form.attr('action'),
        data: formData
      }).done(function(response) {
        // Make sure that the formMessages div has the 'success' class.
        $(formMessages).removeClass('alert alert-danger');
        $(formMessages).addClass('alert alert-success fade show');

        // Set the message text.
        formMessages.html("<button type='button' class='btn-close' data-bs-dismiss='alert'>&times;</button>");
        formMessages.append(response);

        // Clear the form.
        $('#contact-form input,#contact-form textarea').val('');
      }).fail(function(data) {
        // Make sure that the formMessages div has the 'error' class.
        $(formMessages).removeClass('alert alert-success');
        $(formMessages).addClass('alert alert-danger fade show');

        // Set the message text.
        if (data.responseText === '') {
          formMessages.html("<button type='button' class='btn-close' data-bs-dismiss='alert'>&times;</button>");
          formMessages.append(data.responseText);
        } else {
          $(formMessages).text('Oops! An error occurred and your message could not be sent.');
        }
      });
    });

    // Portfolio Filter Js
      const activeId = $(".isotope-filter button");
      $(".isotope-grid").isotope();
        activeId.on('click', function () {
        const $this = $(this),
        filterValue = $this.data('filter');
        $(".isotope-grid").isotope({
          filter: filterValue
        });
        activeId.removeClass('active');
        $this.addClass('active');
      });

  // scrollToTop Js
    function scrollToTop() {
      var $scrollUp = $('#scroll-to-top'),
        $lastScrollTop = 0,
        $window = $(window);
        $window.on('scroll', function () {
        var st = $(this).scrollTop();
          if (st > $lastScrollTop) {
              $scrollUp.removeClass('show');
          } else {
            if ($window.scrollTop() > 120) {
              $scrollUp.addClass('show');
            } else {
              $scrollUp.removeClass('show');
            }
          }
          $lastScrollTop = st;
      });
      $scrollUp.on('click', function (evt) {
        $('html, body').animate({scrollTop: 0}, 50);
        evt.preventDefault();
      });
    }
    scrollToTop();
  
/* ==========================================================================
   When document is loading, do
   ========================================================================== */
  var varWindow = $(window);
  varWindow.on('load', function() {
    // stylePreloader
      stylePreloader();
  });

})(window.jQuery);