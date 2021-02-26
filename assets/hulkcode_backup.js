
            
      function hulkappsDoActions(data) {
        if (typeof data.discounts == "object" && typeof data.discounts.cart == "object" && typeof data.discounts.cart.items == "object") {
            hulkappsShowCartDiscounts(data.discounts)
        }
      }

      function hulkappsShowCartDiscounts(discounts) {
        window.hulkapps.discounts = discounts;
        var flag=0;
        discounts.cart.items.forEach(function(item) {
          if (item.discounted_price < item.original_price) {
            flag=1;
            jQuery(".hulkapps-cart-item-price[data-key='" + item.key + "']").html("<span class='original_price' style='text-decoration:line-through;'>" + item.original_price_format + "</span><br/>" + "<span class='discounted_price'>" + item.discounted_price_format + "</span>");
            jQuery(".hulkapps-cart-item-line-price[data-key='" + item.key + "']").html("<span class='original_price' style='text-decoration:line-through;'>" + item.original_line_price_format + "</span><br/>" + "<span class='discounted_price'>" + item.discounted_line_price_format + "</span>")
          }
          else{
            jQuery(".hulkapps-cart-item-price[data-key='" + item.key + "']").html("<span class='original_price'>" + item.original_price_format + "</span>");
            jQuery(".hulkapps-cart-item-line-price[data-key='" + item.key + "']").html("<span class='original_price'>" + item.original_line_price_format + "</span>")            
          }        
        });
        if(flag==1){
          jQuery(".hulkapps-cart-original-total").html(discounts.original_price_total).css("text-decoration", "line-through");
          jQuery("<span class='hulkapps-cart-total'>" + discounts.discounted_price_total + "</span>").insertAfter('.hulkapps-cart-original-total');        
          jQuery(".hulkapps-header-cart-total").html(discounts.discounted_price_total); 
          
        }
        else{
          jQuery(".hulkapps-cart-original-total").html(discounts.original_price_total);
          jQuery(".hulkapps-header-cart-total").html(discounts.original_price_total);
        }
        jQuery(document).on('click', "input[name='checkout']:not(.hulkapps-ignore), input[value='Checkout']:not(.hulkapps-ignore), button[name='checkout']:not(.hulkapps-ignore), [href$='checkout']:not(.hulkapps-ignore), button[value='Checkout']:not(.hulkapps-ignore), input[name='goto_pp'], button[name='goto_pp'], input[name='goto_gc'], button[name='goto_gc']", function(e){
          e.preventDefault();
          if (typeof hulkappsCheckout != "function") {
            window.location = "/checkout";
          }
          jQuery.ajax({
                      cache: false,
                      contentType: "application/json; charset=utf-8",
                      dataType: "json",
                      type: "GET",
                      url: '/cart.js',
                      success: function(res) {
                        window.hulkapps.cart = res;
                        hulkappsCheckout();
                      }
                    });
        });
      }

      function hulkappsCheckout() {
          for (var i = 0; i < window.hulkapps.cart.items.length; i++) {
              var item = window.hulkapps.cart.items[i];
              var el = document.querySelectorAll("[id='updates_" + item.key + "']");
              if (el.length != 1) {
                  el = document.querySelectorAll("[id='updates_" + item.variant_id + "']")
              }
              if (el.length == 1) {
                  window.hulkapps.cart.items[i].quantity = el[0].value
              }
          }
          var pv_draft_url = "https://volumediscount.hulkapps.com/shop/create_draft_order";
          if(window.hulkapps.is_volume_discount == "false"){
            pv_draft_url = "https://productoption.hulkapps.com/store/create_draft_order" 
          }
          $.post("/cart/update.js", $('form[action="/cart"]').serialize());
          $.ajax({
            type: "POST",
            url: pv_draft_url,
            data: {cart_json: JSON.stringify(window.hulkapps),store_id: window.hulkapps.store_id},
            crossDomain: true,
            success: function(res) {
                 if (typeof res == "string") {
                    window.location.href = res
                } else {
                    window.location.href = "/checkout"
                
              }
            }
          });
      }

      function hulkappsStart() {
        window.hulkappsc = {};
        setTimeout(function() {
          window.hulkappsc.$first_add_to_cart_el = null;
          var selectors = ["input[name='add']", "button[name='add']", "#add-to-cart", "#AddToCartText", "#AddToCart"];
          var found_selectors = 0;
          selectors.forEach(function(selector) {
              found_selectors += jQuery(selector).length;
              if (window.hulkappsc.$first_add_to_cart_el == null && found_selectors) {
                  window.hulkappsc.$first_add_to_cart_el = jQuery(selector).first()
              }
          });
          if (window.hulkapps.page_type == "product" && jQuery(".hulkapps-volumes").length == 0 && window.hulkappsc.$first_add_to_cart_el != null) {
              var vol_el_after = window.hulkappsc.$first_add_to_cart_el;
              if (vol_el_after.parent().is("div")) {
                  vol_el_after = vol_el_after.parent()
              }
              vol_el_after.after('<div class="hulkapps-volumes"></div>');
              $.ajax({
                    type:"GET",
                    url: "https://volumediscount.hulkapps.com/shop/get_offer_table",
                    data : { pid : window.hulkapps.product_id,store_id : window.hulkapps.store_id},
                    crossDomain: true,
                    success:function(data){
                      $('.hulkapps-volumes').html(data);
                    }
              });
          }
          jQuery("body").on("change", 'input[name="updates[]"]', function(ev) {
              jQuery('[name="update"]').click()
          });
        }, 1);

        if(window.hulkapps.page_type == "cart"){
          var pv_cart_url = '';
          if(window.hulkapps.is_volume_discount == "true"){
            pv_cart_url = "https://volumediscount.hulkapps.com/shop/get_cart_details"; 
          }else if(window.hulkapps.is_product_option == "true"){
            pv_cart_url = "https://productoption.hulkapps.com/store/get_cart_details"
          }
          if(pv_cart_url != ''){
            $.ajax({
              type: "POST",
              url: pv_cart_url,
              data: {cart_data: JSON.stringify(window.hulkapps),store_id: window.hulkapps.store_id},
                crossDomain: true,
                success: function(data) {
                      setTimeout(function() {
                          hulkappsDoActions(data)
                      }, 1)
                  }
            });
          }
        }

      }

      $.ajax({
        type:'GET',
        url: 'https://volumediscount.hulkapps.com/shop/is_installed',
        data : {store_id : window.hulkapps.store_id},
        crossDomain: true,
        success:function(data){
          window.hulkapps.is_volume_discount = data;
          $.ajax({
            type:'GET',
            url: 'https://productoption.hulkapps.com/shop/is_installed',
            data : {store_id : window.hulkapps.store_id},
            crossDomain: true,
            success:function(data){
              window.hulkapps.is_product_option = data;
              if(window.hulkapps.is_product_option || window.hulkapps.is_volume_discount){
                hulkappsStart();
              }
            }
          });
        }
      });
    