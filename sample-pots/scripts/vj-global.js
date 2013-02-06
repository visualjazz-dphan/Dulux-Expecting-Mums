var MYPROJECT = MYPROJECT || {};

MYPROJECT.samplePots = (function () {
		
	var colourCarousel = function () {

		var slideColor, slideClass;

		$('#sp-carousel-slides')
			.cycle({
				fx: 		'turnDown',
			    speed: 		500, 
			    timeout: 	0, 
			    pager: 		'#sp-carousel-nav', 
			    pagerEvent: 'click', 
			    pauseOnPagerHover: true,
			    next: '#sp-carousel-next', 
    			prev: '#sp-carousel-prev',

    			// callback fn that creates a thumbnail to use as pager anchor 
			    pagerAnchorBuilder: function(idx, slide) { 

			    	slideColor = $(slide).data('cname');
					slideClass = $(slide).data('class');
					
			        return '<li class="' +slideClass +'"><a href="#">' +slideColor +'</a></li>'; 
			    } 
			});

	}
		
	// public functions
	return {
		init: function () {
			colourCarousel();
		}
	};

}());