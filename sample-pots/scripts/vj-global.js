var MYPROJECT = MYPROJECT || {};

MYPROJECT.samplePots = (function () {
		
	var colourCarousel = function () {

		var slideColor, slideClass,
			firstTime = true;
			// iframeTemplate = '<iframe width="500" 1 height="281" src="http://www.youtube.com/embed/iCkYw3cRwLo?rel=0" frameborder="0" allowfullscreen></iframe>';

		$('#sp-carousel-slides').cycle({

			fx: 		'scrollHorz',
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
		    },
			after: function(currSlideElement, nextSlideElement, options, forwardFlag) {
				var ytid = $(nextSlideElement).find('.sp-carousel-slide-video').data('ytid');
					
		    	if (firstTime === true) {
		    		//console.log(firstTime)
		    		$(nextSlideElement).find('.sp-carousel-slide-video').append('<iframe width="500" height="281" class="sp-video" src="http://www.youtube.com/embed/' +ytid +'?rel=0&autoplay=1" frameborder="0" allowfullscreen></iframe>');
		    		firstTime = false;
		    	} else {
		    		//console.log(firstTime)
		    		$(nextSlideElement).find('.sp-carousel-slide-video').append('<iframe width="500" height="281" class="sp-video" src="http://www.youtube.com/embed/' +ytid +'?rel=0&autoplay=1" frameborder="0" allowfullscreen></iframe>');
		    		$(currSlideElement).find('.sp-carousel-slide-video').html('');
		    	}

			}
		});

	},

	colourPicker = function () {

		var $cGrid = $('#sp-cgrid'),
			$cgridBlocker = $('#sp-blocker'),
			colourSelected = null,
			$selectedColourOne = $('#sp-colour-one'),
			$selectedColourTwo = $('#sp-colour-two'),
			$removeColourBtn = $('#sp-form').find('.sp-close-btn'),
			$colourCodeOne = $('#colour-sel-one'),
			$colourCodeTwo = $('#colour-sel-two'),
			$oneColourAdded = $('#one-colour-added'),
			popupOpened = false,
			warningPopup = false,
			popupClicked = false;

		$cGrid.find('a').on('click', function (e) {

			e.preventDefault();
			var $this = $(this),
				colourClass = $this.find('.sp-code').text(),
				colourName = $this.find('.sp-name').text(),
				closePopup = function (warningPopup) {
					//console.log('close me ', warningPopup, " ",$this.siblings('.sp-popup.'+colourClass).length," ", colourClass )
					//window.testob = $this.siblings('.sp-popup.'+colourClass);
					if (warningPopup === true) {
						$this.siblings('.sp-popup.sp-warning').remove();
					} else {
						$this.siblings('.sp-popup.'+colourClass).remove();
					}
					popupOpened = false;
					$cgridBlocker.hide();
					$this.css('z-index', '0').parent('li').css('z-index', '0');
				};

			if (popupOpened === false) {

				popupOpened = true;
				$cgridBlocker.show();
				//must also increase z-index of parent for IE7 :/
				$this.css({'position': 'relative','z-index': '2'}).parent('li').css('z-index', '2');

				//check if colour already selected
				if ($this.hasClass('sp-active')) {

					//if colour already selected
					//console.log('colour already added');
					$this.parent('li').prepend('\
						<a href="#" class="sp-popup ' +colourClass +'" id="sp-popup" data-class="' +colourClass +'">\
							<span class="heading"><h5>' +colourName +'</h5></span>\
							<span class="sp-desc">Click to <strong>remove</strong> this colour from your order</span>\
						</a>\
					');
					colourSelected = 'yes';
					warningPopup = false;

				} else if ($selectedColourOne.attr('data-selected') === 'selected' && $selectedColourTwo.attr('data-selected') === 'selected') {

					//if 2 colours selected
					//console.log('cant select anymore colours');
					$this.parent('li').prepend('\
						<a href="#" class="sp-popup sp-warning" id="sp-popup">\
							<span class="heading"><h5>You have already chosen two colours</h5></span>\
							<span class="sp-desc">If you would like to select a different colour, please remove a colour first.</span>\
						</a>\
					');
					colourSelected = null;
					warningPopup = true;

				} else {

					//if colour not yet selected
					//console.log('no colour');
					$this.parent('li').prepend('\
						<a href="#" class="sp-popup ' +colourClass +'" id="sp-popup" data-class="' +colourClass +'">\
							<span class="heading"><h5>' +colourName +'</h5></span>\
							<span class="sp-desc">Click to add this colour to your free sample pot order</span>\
						</a>\
					');
					colourSelected = null;
					warningPopup = false;

				}

				bindPopup(warningPopup, colourSelected);

				$cgridBlocker.on('click', function () {
					closePopup(warningPopup);
				});

			} else if (popupOpened === true) {
				closePopup(warningPopup);
			}

		});

		function bindPopup (warningPopup, colourSelected) {

			$('#sp-popup').on('click', function (e) {

				e.preventDefault();

				//if statement to disable double adding/removing
				//for when popup has added colour, but still showing - can't click to add/remove again
				if (popupClicked === false) {

					var $this = $(this),
						colourName = $this.find('h5').text(),
						colourClass = $this.data('class'),
						$closeBtn = $('#sp-form').find('.sp-colour-box.sp-colour-added.'+colourClass).children('.sp-close-btn');

					popupClicked = true;

					if (warningPopup === true) {
						//if 2 colours have already been selected

						$this.siblings('.sp-colour-btn').css('z-index', '0').end().parent('li').css('z-index', '0').end().remove();
						popupOpened = false;
						$cgridBlocker.hide();
						popupClicked = false;
					
					} else if (colourSelected === 'yes') {
						//check if colour already added to colour selection box, yes == remove colour, no(else) == add colour

						//console.log('colourSelected: ' +colourSelected);
						if ($selectedColourOne.hasClass(colourClass)) {
							//if box 1 has colour to be removed
							$selectedColourOne.removeClass('sp-colour-added ' +colourClass).find('span').text('Pick another colour').end().attr('data-selected', 'unselected').attr('data-colourcode', 'none');
							//remove colour code from hidden input 1
							$colourCodeOne.val('');
						} else {
							//otherwise must be box 2 to have colour removed
							$selectedColourTwo.removeClass('sp-colour-added ' +colourClass).find('span').text('Pick another colour').end().attr('data-selected', 'unselected').attr('data-colourcode', 'none');
							//remove colour code from hidden input 1
							$colourCodeTwo.val('');
						}

						//if both colour codes are removed, empty field 'at least one colour added' for valiation purposes
						if (($colourCodeOne.val() === '') && ($colourCodeTwo.val() === '')) {
							$oneColourAdded.val('');
						}

						//2. hide close button
						$closeBtn.css('visibility', 'hidden');

						//3. change text 'removed' + remove selected class to colour
						$this.find('.sp-desc').removeClass('sp-desc').addClass('sp-added').text('Removed!').end().siblings('.sp-colour-btn').removeClass('sp-active');

						//4. close popup + remove blocker
						setTimeout(function() {
							$this.siblings('.sp-colour-btn').css('z-index', '0').end().parent('li').css('z-index', '0').end().remove();
							popupOpened = false;
							$cgridBlocker.hide();
							popupClicked = false;
						}, 500);

					} else {

						//console.log('colourSelected: ' +colourSelected);

						//1. check & add to selected colours
						if ($selectedColourOne.attr('data-selected') === 'unselected') {
							//console.log('nothing in 1');
							$selectedColourOne.addClass('sp-colour-added ' +colourClass).find('span').text(colourName).end().attr('data-selected', 'selected').attr('data-colourcode', colourClass).children('.sp-close-btn').css('visibility', 'visible');
							//pass value to hidden field #1 here
							$colourCodeOne.val(colourClass);
							$oneColourAdded.val(colourClass).trigger('change');
						} else {
							//console.log('nothing in 2');
							$selectedColourTwo.addClass('sp-colour-added ' +colourClass).find('span').text(colourName).end().attr('data-selected', 'selected').attr('data-colourcode', colourClass).children('.sp-close-btn').css('visibility', 'visible');
							//pass value to hidden field #2 here
							$colourCodeTwo.val(colourClass);
							$oneColourAdded.val(colourClass).trigger('change');
						}

						//2. change text 'added' + add selected class to colour
						$this.find('.sp-desc').removeClass('sp-desc').addClass('sp-added').text('Added!').end().siblings('.sp-colour-btn').addClass('sp-active');

						//3. close popup + remove blocker
						setTimeout(function() {
							$this.siblings('.sp-colour-btn').css('z-index', '0').end().parent('li').css('z-index', '0').end().remove();
							popupOpened = false;
							$cgridBlocker.hide();
							popupClicked = false;
						}, 500);

					}

				}

			});

		}

		$removeColourBtn.on('click', function (e) {

			//console.log('clicked')
			e.preventDefault()

			var $this = $(this),
				colourIdentification = $this.parent().attr('data-colourcode');

			//find, remove active on colour in grid
			$cGrid.find('.'+colourIdentification).children('a').removeClass('sp-active');

			//remove colour code from appropriate hidden field
			if ($this.closest('div').attr('id') === 'sp-colour-one') {
				$colourCodeOne.val('');
			} else {
				$colourCodeTwo.val('');
			}

			//if both colour codes are removed, empty field 'at least one colour added' for valiation purposes
			if (($colourCodeOne.val() === '') && ($colourCodeTwo.val() === '')) {
				$oneColourAdded.val('');
			}

			//retreive colour identifier for active class removal later + reset data-colourcode + hide close button
			$this.parent().removeClass().addClass('sp-colour-box').attr('data-selected', 'unselected').attr('data-colourcode', 'none').find('span').text('Pick another colour').end().end().css('visibility', 'hidden');

		});

	},

	validation = {
    //call this function on any page that requires some sort of form validation..

        init: function () {

            var form = $('#aspnetForm');

            form.each(function () {
                var $this = $(this);
                validation.basic($this);
            });

            form.find('.rule').each(function () {
                var $this = $(this),
					type = $this.data('type'),
					param = $this.data('param'),
					obj = {};

                obj[type] = param;

                $this.rules("add", obj);
            });
        },
        basic: function (ele) {
            ele.validate({
                //basic validation, adds an error class to the input in error.
                //TODO add handling for checkboxes..
                //thinking about changin markup to suit...
                showErrors: function (errorMap, errorList) {
                    for (var i = 0, max = errorList.length; i < max; i += 1) {
                        $(errorList[i].element).addClass('error');
                        if ($('#one-colour-added').hasClass('error')) {
                            $('#sp-colour-validation').css('visibility', 'visible');
                        }
                        $('#sp-error-msg').show();
                    }
                }
            });
            ele.on('change', '.error', function () {
                if ($(this).valid()) {
                    $(this).removeClass('error');
                    if (!$('#one-colour-added').hasClass('error')) {
                        $('#sp-colour-validation').css('visibility', 'hidden');
                    }
                }
            });
            ele.on('keyup', '.error', function () {
                if ($(this).valid()) {
                    $(this).removeClass('error');
                }
            });
        }
    }
		
	// public functions
	return {
		init: function () {

			var $context = $('#sample-pots');
			if ($context.length == 0 || $context.size() == 0) return;

			colourCarousel();
			colourPicker();
			validation.init();

		}
	};

}());