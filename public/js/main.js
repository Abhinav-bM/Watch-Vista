(function ($) {
"use strict";

// meanmenu
$('#mobile-menu').meanmenu({
	meanMenuContainer: '.mobile-menu',
	meanScreenWidth: "992",
	meanExpand: ">",
});

// One Page Nav
var top_offset = $('.header-area').height() - 10;
$('.main-menu nav ul').onePageNav({
	currentClass: 'active',
	scrollOffset: top_offset,
});


$(window).on('scroll', function () {
	var scroll = $(window).scrollTop();
	if (scroll < 245) {
		$(".header-sticky").removeClass("sticky");
		$('header.header .widget-search').show();
		$('.hidden-scroll').removeClass('d-none-important');
		$('.mt-scroll-0').css({
			"marginTop" : "30px"
		});
	} else {
		$(".header-sticky").addClass("sticky");
		$('header.header').css({
			'paddingTop': '30px',
			'paddingBottom': '15px',
		})
		$('.sticky').css({
			'top': '0'
		})
		$('header.header .widget-search').hide();
		$('.hidden-scroll').addClass('d-none-important');
		$('.mt-scroll-0').css({
			"marginTop" : "0"
		});
	}
});

$(window).on('load',function(){
	$('#loader-wrapper').hide();
})
// top left search focus
$('.top-left-search-form form input').on('focusin',function(){
	$('.product-show-box').css({
		"display": "block"
	});
})
$('.top-left-search-form form input').on('focusout',function(){
	$('.product-show-box').css({
		"display": "none"
	});
})
// $('.show-proudct-main').load(function(){
// 	console.log('hello')
// })

// data background
$("[data-background").each(function(){
	$(this).css("background-image","url("+$(this).attr("data-background") + ") ")
})
$("[data-bg-color]").each(function(){
	$(this).css("background",$(this).attr("data-bg-color"))
})

// mainSlider
function mainSlider() {
	var BasicSlider = $('.slider-active');
	BasicSlider.on('init', function (e, slick) {
		var $firstAnimatingElements = $('.single-slider:first-child').find('[data-animation]');
		doAnimations($firstAnimatingElements);
	});
	BasicSlider.on('beforeChange', function (e, slick, currentSlide, nextSlide) {
		var $animatingElements = $('.single-slider[data-slick-index="' + nextSlide + '"]').find('[data-animation]');
		doAnimations($animatingElements);
	});
	BasicSlider.slick({
		autoplay: true,
		autoplaySpeed: 10000,
		dots: true,
		fade: true,
		arrows: false,
		responsive: [
			{ breakpoint: 767, settings: { dots: true, arrows: false } }
		]
	});

	function doAnimations(elements) {
		var animationEndEvents = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
		elements.each(function () {
			var $this = $(this);
			var $animationDelay = $this.data('delay');
			var $animationType = 'animated ' + $this.data('animation');
			$this.css({
				'animation-delay': $animationDelay,
				'-webkit-animation-delay': $animationDelay
			});
			$this.addClass($animationType).one(animationEndEvents, function () {
				$this.removeClass($animationType);
			});
		});
	}
}
mainSlider();


// owlCarousel
// $('.owl-carousel').owlCarousel({
//     loop:true,
//     margin:0,
// 	items:1,
// 	navText:['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
//     nav:true,
// 	dots:false,
//     responsive:{
//         0:{
//             items:1
//         },
//         767:{
//             items:3
//         },
//         992:{
//             items:5
//         }
//     }
// })
// owlCarousel
$('.new-arrival-carousel').owlCarousel({
    loop:true,
    margin:0,
	items:1,
	navText:['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
    nav:true,
	dots:false,
    responsive:{
        0:{
            items:1
        },
        500:{
            items:2
        },
        992:{
            items:3
		},
		1200: {
			items: 4
		}
    }
})
$('.blog-carousel').owlCarousel({
    loop:true,
    margin:0,
	items:1,
	navText:['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
    nav:true,
	dots:false,
    responsive:{
        0:{
            items:1
        },
        500:{
            items:1
        },
        700:{
            items:2
		},
		1200: {
			items: 3
		}
    }
})
$('.product-3-carousel').owlCarousel({
    loop:true,
    margin:30,
	items:1,
	navText:['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
    nav:true,
	dots:false,
    responsive:{
        0:{
            items:1
        },
        500:{
            items:1
        },
        700:{
            items:2
		},
		1200: {
			items: 3
		}
    }
})

$('.testimonial-carousel').owlCarousel({
	loop:true,
	smartSpeed: 1000,
    margin:30,
	items:1,
	navText:['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
    nav:false,
	dots:true,
})

$('.main-product-carousel').owlCarousel({
    loop:true,
    margin:0,
	items:1,
	navText:['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
    nav:true,
	dots:false,
    responsive:{
        0:{
            items:1
		},
		500: {
			items: 2
		},
        767:{
            items:3
        },
        992:{
            items:4
		},
		1200: {
			items: 5
		}
    }
})

$('.small-img-carousel').owlCarousel({
    loop:true,
    margin:20,
	items:1,
	navText:['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
    nav:true,
	dots:false,
    responsive:{
        0:{
			items:2

		},
		500: {
			items: 4
		},
        767:{
            items:4
        },
        992:{
            items:4
		},
		1200: {
			items: 5
		}
    }
})

$('.main-product-carousel-4').owlCarousel({
    loop:true,
    margin:0,
	items:1,
	navText:['<i class="fa fa-angle-left"></i>','<i class="fa fa-angle-right"></i>'],
    nav:true,
	dots:false,
    responsive:{
        0:{
            items:1
		},
		500: {
			items: 2
		},
        767:{
            items:3
        },
        992:{
            items:3
		},
		1200: {
			items: 4
		}
    }
})

/* magnificPopup img view */
$('.popup-image').magnificPopup({
	type: 'image',
	gallery: {
	  enabled: true
	}
});

/* magnificPopup video view */
$('.video-popup').magnificPopup({
	type: 'iframe',
	iframe: {
		markup: '<div class="mfp-iframe-scaler">'+
				  '<div class="mfp-close"></div>'+
				  '<iframe class="mfp-iframe" frameborder="0" allowfullscreen></iframe>'+
				'</div>', // HTML markup of popup, `mfp-close` will be replaced by the close button

		patterns: {
		  youtube: {
			index: 'youtube.com/',
			id: 'v=',

			src: 'https://www.youtube.com/embed/e2FKXPzsT7E'
		  },

		},

		srcAction: 'iframe_src',
	  }
});


// isotop
$('.grid').imagesLoaded( function() {
	// init Isotope
	var $grid = $('.grid').isotope({
	  itemSelector: '.grid-item',
	  percentPosition: true,
	  masonry: {
		// use outer width of grid-sizer for columnWidth
		columnWidth: '.grid-item',
	  }
	});
});

// filter items on button click
$('.portfolio-menu').on( 'click', 'button', function() {
  var filterValue = $(this).attr('data-filter');
  $grid.isotope({ filter: filterValue });
});

//for menu active class
$('.portfolio-menu button').on('click', function(event) {
	$(this).siblings('.active').removeClass('active');
	$(this).addClass('active');
	event.preventDefault();
});




// scrollToTop
$.scrollUp({
	scrollName: 'scrollUp', // Element ID
	topDistance: '300', // Distance from top before showing element (px)
	topSpeed: 300, // Speed back to top (ms)
	animation: 'fade', // Fade, slide, none
	animationInSpeed: 200, // Animation in speed (ms)
	animationOutSpeed: 200, // Animation out speed (ms)
	scrollText: "<i class='fal fa-angle-double-up'></i>", // Text for element
	activeOverlay: false, // Set CSS color to display scrollUp active point, e.g '#00FFFF'
});

// WOW active
new WOW().init();


// bootstrap tooltip
$(function () {
	$('[data-toggle="tooltip"]').tooltip()
  })

//   header search popup
$('header.header i.fa-search').on('click',function(){
	$('#search-popup').css({
		'opacity' : '1',
		'visibility' : 'visible'
	})
})
$('.close-search-popup').on('click',function(){
	$('#search-popup').css({
		'opacity' : '0',
		'visibility' : 'hidden'
	})
})


// slick slider text content
$('#slick-slide-control00').html('Lookbook');
$('#slick-slide-control01').html('Over.S18');
$('#slick-slide-control02').html('Style.S16');
// slick slider number content
$('.number-dots #slick-slide-control00').html('01');
$('.number-dots #slick-slide-control01').html('02');
$('.number-dots #slick-slide-control02').html('03');





	/* Price filter active */
	if ($("#slider-range").length) {
		$("#slider-range").slider({
			range: true,
			min: 0,
			max: 500,
			values: [75, 300],
			slide: function (event, ui) {
				$("#amount").val("$" + ui.values[0] + " - $" + ui.values[1]);
			}
		});
		$("#amount").val("$" + $("#slider-range").slider("values", 0) +
			" - $" + $("#slider-range").slider("values", 1));
		$('#filter-btn').on('click', function () {
			$('.filter-widget').slideToggle(1000);
		});

	}

	if ($("#slider-range-2").length) {
		$("#slider-range-2").slider({
			range: true,
			min: 0,
			max: 500,
			values: [75, 300],
			slide: function (event, ui) {
				$("#amount-2").val("$" + ui.values[0] + " - $" + ui.values[1]);
			}
		});
		$("#amount-2").val("$" + $("#slider-range-2").slider("values", 0) +
			" - $" + $("#slider-range-2").slider("values", 1));
		$('#filter-btn-2').on('click', function () {
			$('.filter-widget').slideToggle(1000);
		});

	}

	// filter widget toggle
	$('.filter-popup').hide();
	$('.filter-widget-toggle').on('click',function(){
		$('.filter-popup').slideToggle(500);
	})



	// fixed sidebar
	$( document ).ready(function() {

		var setState = function() {
		  if(length > yPos && width > xPos){
			//use the fixed sidebar state
			$('#sidebar-fluid').hide();
			$('#sidebar-fixed').show();
		  }else{
			//use the fluid sidebar state
			$('#sidebar-fluid').show();
			$('#sidebar-fixed').hide();
		  }
		}

		var xPos = 683;
		var yPos = 240;

		var length = $(window).scrollTop();
		var width = $(window).width();

		$( window ).scroll(function (event) {
		  length = $(window).scrollTop();
		  setState();
		});

		$( window ).resize(function() {
		  width = $(window).width();
		  setState();
		});

	  });



	//   price calculate
	$('.price-calculate').on('click',function(){
		$('.calculate-shipping-box').slideToggle(500);
	})

/*----- cart-plus-minus-button -----*/
$(".cart-plus-minus").append('<div class="dec qtybutton">-</div><div class="inc qtybutton">+</div>');
$(".qtybutton").on("click", function () {
	var $button = $(this);
	var oldValue = $button.parent().find("input").val();
	if ($button.text() == "+") {
		var newVal = parseFloat(oldValue) + 1;
	} else {
		// Don't allow decrementing below zero
		if (oldValue > 0) {
			var newVal = parseFloat(oldValue) - 1;
		} else {
			newVal = 0;
		}
	}
	$button.parent().find("input").val(newVal);
});


/*-------------------------
	showlogin toggle function
--------------------------*/
$('#showlogin').on('click', function () {
	$('#checkout-login').slideToggle(900);
});

/*-------------------------
	showcoupon toggle function
--------------------------*/
$('#showcoupon').on('click', function () {
	$('#checkout_coupon').slideToggle(900);
});

/*-------------------------
	Create an account toggle function
--------------------------*/
$('#cbox').on('click', function () {
	$('#cbox_info').slideToggle(900);
});

/*-------------------------
	Create an account toggle function
--------------------------*/
$('#ship-box').on('click', function () {
	$('#ship-box-info').slideToggle(1000);
});


	//   mixitup
	var mixer = mixitup('.container-fluid');

})(jQuery);
