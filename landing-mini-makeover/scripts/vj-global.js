var MINIMAKER = MINIMAKER || {};

MINIMAKER.presentation = (function () {
		
		minimakerVote = {
			 init: function (){
				this.voteColor();
			},			
			voteColor : function(){				
				var resultPosition = $(".results").position().top;	

				$(".dulux-color-section a").bind("click", function(e){
					
					$(".dulux-color-section a").addClass("disabled").unbind('click');
					$(this).addClass("active");
					$('html,body').animate({scrollTop: resultPosition});
					
					var colorSelection = $(this).attr("href");						
					
					$(colorSelection).hide();	
									
					var currentVote = $(colorSelection).text().split("%");
						
						totalVote = parseFloat(currentVote) + 0.1;					
						$(colorSelection).fadeIn(700).html(totalVote.toFixed(1) + "%");
						e.preventDefault();
					
					$(".dulux-color-section a").removeAttr("href");
					
					var currentRecord = $(".results li").text().replace( /\%/ig , ',');
					
					$.cookie("recordColor", currentRecord.substr( 0,  currentRecord.length - 1), {expires: 365});
				});	
				
				try {
					var votes = $.cookie("recordColor").split(',');
					$(".results li").each(function(e) {
                        $(this).text( votes[e] + '%' );
                    });
				} catch(e) {
				}

			}
		}
		
	// public functions
	return {
		init: function () {
			minimakerVote.init();
		}
	};

}());
