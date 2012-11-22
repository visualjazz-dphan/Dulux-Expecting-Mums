var MINIMAKER = MINIMAKER || {};

MINIMAKER.presentation = (function () {
		
		minimakerVote = {
			 init: function (){
				this.voteColor();
				this.updateCalculation();
				this.cookiesPercentage();
			},			
			voteColor : function(){				
				var _self = this;
					resultPosition = $(".results").position().top;	

				$(".dulux-color-section a").bind("click", function(e){
					
					$(".dulux-color-section a").addClass("disabled").unbind('click');
					$(this).addClass("active");
					$('html,body').animate({scrollTop: resultPosition});
					
					var colorSelection = $(this).attr("href");						
					
					$(colorSelection).find("input").val( parseInt($(colorSelection).find("input").val()) + 1 );
					
					$(".dulux-color-section a").removeAttr("href");
					
					var currentRecord = $(".results li").text().replace( /\%/ig , ',');
					
					$.cookie("recordColor", currentRecord.substr( 0,  currentRecord.length - 1), {expires: 365});
					_self.updateCalculation();
					_self.cookiesPercentage();
				});	
			}, 
			updateCalculation : function(){
				$.fn.sumValues = function() {
					var sum = 0;
					this.each(function() {
						if ( $(this).is(':input') ) {
							var val = $(this).val();
						} else {
							var val = $(this).text();
						}
						sum += parseFloat( ('0' + val).replace(/[^0-9-\.]/g, ''), 10);
					});
					return sum;
				}; 
				
				function percentage(price,sum)
				{
					var p = 0;
					p = parseFloat(price/sum*100).toFixed(1);
					if(isNaN(p)) p = '';
					return p;
				}
				
				
				$('.results li span').each(function(){
					$('.results li span').hide();
					$('.results li span').fadeIn();
					$(this).html(percentage($(this).prev("input").val(),$('input.price').sumValues()) + "%");
					if($(this).prev("input").val() == 0){
						$(this).html("0.0%");	
					}
				});
						
			}, 
			cookiesPercentage : function(){
				
			}
		}
		
	// public functions
	return {
		init: function () {
			minimakerVote.init();
		}
	};

}());
