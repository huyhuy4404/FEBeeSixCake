var app = angular.module("myApp", []);

// Tạo một controller mới với tên 'loadSanPhamDanhGia'
app.controller("loadSanPhamDanhGia", function ($scope, $http) {
  const API = "http://localhost:8080/beesixcake/api"; // Địa chỉ API
  const imageBaseUrl = "https://5ck6jg.csb.app/anh/"; // Base URL cho hình ảnh
  const productId = new URLSearchParams(window.location.search).get(
    "idproduct"
  );
  const orderDetailId = new URLSearchParams(window.location.search).get(
    "idorderdetail"
  );

  if (orderDetailId) {
    $http
      .get(`${API}/orderdetail/${orderDetailId}`)
      .then(function (response) {
        const orderDetail = response.data;
        const orderId = orderDetail.order.idorder;
        const quantity = orderDetail.quantity;
        const productDetailId = orderDetail.productdetail.idproductdetail;

        console.log("Lấy được thông tin orderdetail:", orderDetail);
        console.log("Order ID:", orderId);
        console.log("Quantity:", quantity);
        console.log("Product Detail ID:", productDetailId);
      })
      .catch(function (error) {
        console.error("Lỗi khi lấy thông tin orderdetail:", error);
      });
  }

  // Khởi tạo đối tượng newReview
  $scope.newReview = {
    comment: "",
  };

  // Lấy thông tin sản phẩm từ API
  if (productId) {
    $http
      .get(`${API}/product/${productId}`)
      .then(function (response) {
        console.log("Product Data:", response.data);
        $scope.product = response.data;
        $scope.product.img = imageBaseUrl + $scope.product.img.split("/").pop();
      })
      .catch(function (error) {
        console.error("Error loading product data:", error);
      });
  } else {
    console.log("Product ID is missing!");
  }

  // Lấy giá trị rating khi người dùng chọn sao
  let selectedRating = 0;
  document.querySelectorAll(".rating .star").forEach((star) => {
    star.addEventListener("click", function () {
      selectedRating = parseInt(star.getAttribute("data-value"));
      console.log("Giá trị đánh giá: ", selectedRating);
      highlightStars(selectedRating);
    });
  });

  // Hàm hiển thị màu sắc các sao đã chọn
  function highlightStars(rating) {
    const stars = document.querySelectorAll(".rating .star");
    stars.forEach((star) => {
      const starValue = parseInt(star.getAttribute("data-value"));
      if (starValue <= rating) {
        star.classList.add("selected");
      } else {
        star.classList.remove("selected");
      }
    });
  }

  // Khi người dùng gửi đánh giá
  $scope.submitReview = function () {
    // Lấy nhận xét từ textarea
    const reviewText = $scope.newReview.comment;

    // Lấy thông tin tài khoản từ localStorage
    const accountInfo = JSON.parse(localStorage.getItem("loggedInUser"));

    // Kiểm tra nếu người dùng chưa chọn sao
    if (selectedRating === 0) {
      $scope.notificationMessage = "Vui lòng chọn sao để đánh giá!";
      $("#notificationModal").modal("show");
      return; // Dừng lại không chuyển hướng về trang chủ
    }

    // Kiểm tra nếu chưa đăng nhập
    if (!accountInfo) {
      $scope.notificationMessage = "Vui lòng đăng nhập trước khi đánh giá!";
      $("#notificationModal").modal("show");
      return; // Dừng lại không chuyển hướng về trang chủ
    }

    // Thêm thời gian review (ngày và giờ hiện tại)
    const reviewData = {
      rating: selectedRating,
      reviewtext: $scope.newReview.comment,
      reviewdate: new Date().toISOString(),
      account: {
        idaccount: accountInfo.idaccount,
      },
      product: {
        idproduct: productId,
      },
    };

    // Gửi POST request để tạo đánh giá
    $http
      .post(`${API}/reviews`, reviewData)
      .then(function (response) {
        console.log("Đánh giá thành công", response.data);

        // Cập nhật statusreview của orderdetail
        if (orderDetailId) {
          const updateData = {
            statusreview: true, // Cập nhật chỉ statusreview
          };

          // Cập nhật statusreview trong orderdetail
          $http
            .put(`${API}/orderdetail/${orderDetailId}`, updateData)
            .then(function (response) {
              console.log("Cập nhật statusreview thành công", response.data);
              $scope.notificationMessage = "Cảm ơn bạn đã đánh giá sản phẩm!";
              $("#notificationModal").modal("show");

              // Sau khi modal đóng, chuyển hướng về trang chủ
              $("#notificationModal").on("hidden.bs.modal", function () {
                window.location.href = "index.html"; // Chuyển hướng về trang chủ
              });
            })
            .catch(function (error) {
              console.error("Lỗi khi cập nhật statusreview:", error);
              $scope.notificationMessage = "Có lỗi khi cập nhật đánh giá!";
              $("#notificationModal").modal("show");
            });
        }
      })
      .catch(function (error) {
        console.error("Lỗi khi gửi đánh giá:", error);
        $scope.notificationMessage =
          "Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.";
        $("#notificationModal").modal("show");
      });
  };

  // Khi người dùng nhấn OK trong modal, chỉ đóng modal mà không chuyển hướng về trang chủ
  $scope.closeModalAndStay = function () {
    $("#notificationModal").modal("hide");
    // Không chuyển hướng về trang chủ ở đây nếu có lỗi
  };
});
app.controller("ProductDetailController", function ($scope, $http) {
  const API = "http://localhost:8080/beesixcake/api";
  const imageBaseUrl = "https://5ck6jg.csb.app/anh/";
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  // Khởi tạo biến
  $scope.product = {};
  $scope.productDetails = [];
  $scope.categories = [];
  $scope.selectedSizeDetail = null;
  $scope.quantity = 1;
  $scope.maxQuantity = 1;
  $scope.favoriteCount = 0;
  $scope.isActive = false;
  $scope.currentFavoriteId = null;
  $scope.loggedInUser =
    JSON.parse(localStorage.getItem("loggedInUser")) || null;
  $scope.notificationMessage = "";
  $scope.showNotification = (message) => {
    $scope.notificationMessage = message;
    $scope.$applyAsync();
    const modal = new bootstrap.Modal(
      document.getElementById("notificationModal")
    );
    modal.show();
  };
  if (!productId) {
    console.error("Product ID is missing from the URL");
    return;
  }

  // **1. Lấy thông tin sản phẩm**
  const fetchProduct = () => {
    $http
      .get(`${API}/product/${productId}`)
      .then((response) => {
        $scope.product = response.data;
        $scope.product.img = imageBaseUrl + $scope.product.img.split("/").pop();
      })
      .catch((error) => {
        console.error("Error fetching product:", error);
      });
  };

  // **2. Lấy chi tiết sản phẩm**
  const fetchProductDetails = () => {
    $http
      .get(`${API}/productdetail`)
      .then((response) => {
        $scope.productDetails = response.data.filter(
          (detail) => detail.product.idproduct == productId
        );

        if ($scope.productDetails.length > 0) {
          $scope.productDetails.forEach((detail) => {
            detail.product.img =
              imageBaseUrl + detail.product.img.split("/").pop();
          });

          $scope.selectedSizeDetail =
            $scope.productDetails.find((detail) => detail.size.idsize === 1) ||
            $scope.productDetails[0];
          $scope.selectedSize = $scope.selectedSizeDetail.size.sizename;
          $scope.maxQuantity = $scope.selectedSizeDetail.quantityinstock;
        } else {
          console.warn("No product details found.");
        }
      })
      .catch((error) => {
        console.error("Error fetching product details:", error);
      });
  };

  // **3. Lấy thông tin yêu thích**
  const fetchFavoriteData = () => {
    if (!$scope.loggedInUser) return;

    $http
      .get(`${API}/favorites`)
      .then((response) => {
        const favorites = response.data;

        const productFavorites = favorites.filter(
          (fav) => fav.product.idproduct == productId
        );
        $scope.favoriteCount = productFavorites.length;

        const userFavorite = productFavorites.find(
          (fav) => fav.account.idaccount === $scope.loggedInUser.idaccount
        );

        if (userFavorite) {
          $scope.isActive = true;
          $scope.currentFavoriteId = userFavorite.idfavorite;
        } else {
          $scope.isActive = false;
          $scope.currentFavoriteId = null;
        }
      })
      .catch((error) => {
        console.error("Error fetching favorites:", error);
      });
  };

  // **4. Thêm vào giỏ hàng**
  $scope.addToCart = () => {
    if (!$scope.loggedInUser) {
      $scope.showNotification(
        "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng."
      );
      return;
    }

    const idaccount = $scope.loggedInUser.idaccount;

    // Lấy ShoppingCart của người dùng
    $http.get(`${API}/shoppingcart/account/${idaccount}`).then((response) => {
      const shoppingCart = response.data[0];

      // Nếu chưa có shoppingcart, tạo mới
      const shoppingCartId = shoppingCart ? shoppingCart.idshoppingcart : null;

      if (!shoppingCartId) {
        $http
          .post(`${API}/shoppingcart`, { account: { idaccount } })
          .then((newCartResponse) => {
            proceedAddToCart(newCartResponse.data.idshoppingcart);
          });
      } else {
        proceedAddToCart(shoppingCartId);
      }
    });

    const proceedAddToCart = (shoppingCartId) => {
      $http
        .get(`${API}/cartitems/shoppingcart/${shoppingCartId}`)
        .then((response) => {
          const cartItems = response.data;

          // Kiểm tra sản phẩm đã tồn tại chưa
          const existingCartItem = cartItems.find(
            (item) =>
              item.productdetail.idproductdetail ===
              $scope.selectedSizeDetail.idproductdetail
          );

          if (existingCartItem) {
            // Nếu tồn tại, cập nhật số lượng
            const updatedQuantity = existingCartItem.quantity + $scope.quantity;

            if (updatedQuantity > $scope.maxQuantity) {
              $scope.showNotification(
                "Số lượng sản phẩm đã vượt quá số lượng trong kho."
              );
              return;
            }

            $http
              .put(`${API}/cartitems/${existingCartItem.idcartitem}`, {
                idcartitem: existingCartItem.idcartitem,
                quantity: updatedQuantity,
                productdetail: {
                  idproductdetail: $scope.selectedSizeDetail.idproductdetail,
                },
                shoppingcart: { idshoppingcart: shoppingCartId },
              })
              .then(() =>
                $scope.showNotification(
                  "Cập nhật số lượng sản phẩm thành công!"
                )
              )
              .catch((error) => {
                console.error("Error updating cart item:", error);
                $scope.showNotification(
                  "Lỗi khi cập nhật sản phẩm. Vui lòng thử lại."
                );
              });
          } else {
            // Nếu chưa tồn tại, thêm mới
            $http
              .post(`${API}/cartitems`, {
                quantity: $scope.quantity,
                productdetail: {
                  idproductdetail: $scope.selectedSizeDetail.idproductdetail,
                },
                shoppingcart: { idshoppingcart: shoppingCartId },
              })
              .then(() =>
                $scope.showNotification(
                  "Thêm sản phẩm vào giỏ hàng thành công!"
                )
              )
              .catch((error) => {
                console.error("Error adding to cart:", error);
                $scope.showNotification(
                  "Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại."
                );
              });
          }
        });
    };
  };

  // **5. Lấy danh mục sản phẩm**
  const fetchCategories = () => {
    $http
      .get(`${API}/category`)
      .then((response) => {
        $scope.categories = response.data;

        $scope.categories.forEach((category) => {
          category.count = 0; // Khởi tạo count là 0
        });

        $http
          .get(`${API}/product`)
          .then((productResponse) => {
            const products = productResponse.data;

            products.forEach((product) => {
              const category = $scope.categories.find(
                (cat) => cat.idcategory === product.category.idcategory
              );
              if (category) category.count++;
            });
          })
          .catch((error) => {
            console.error("Error fetching products:", error);
          });
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
      });
  };

  // **6. Thay đổi kích cỡ**
  $scope.selectSize = (sizename) => {
    $scope.selectedSize = sizename;
    $scope.selectedSizeDetail = $scope.productDetails.find(
      (detail) => detail.size.sizename === sizename
    );
    $scope.maxQuantity = $scope.selectedSizeDetail.quantityinstock || 1;
    $scope.quantity = 1;
  };

  // **7. Giảm/Tăng số lượng**
  $scope.decreaseQuantity = () => {
    if ($scope.quantity > 1) $scope.quantity--;
  };

  $scope.increaseQuantity = () => {
    if ($scope.quantity < $scope.maxQuantity) $scope.quantity++;
  };

  let increaseInterval;
  let decreaseInterval;

  // Bắt đầu tăng số lượng khi nhấn và giữ nút cộng
  $scope.startIncreasing = () => {
    if (!increaseInterval) {
      $scope.increaseQuantity(); // Tăng ngay lập tức khi click
      increaseInterval = setInterval(() => {
        if ($scope.quantity < $scope.maxQuantity) {
          $scope.quantity++;
          $scope.$apply(); // Cập nhật giao diện sau khi thay đổi giá trị
        }
      }, 100); // Tăng liên tục sau mỗi 100ms khi giữ
    }
  };

  // Dừng tăng số lượng khi không còn giữ nút
  $scope.stopIncreasing = () => {
    clearInterval(increaseInterval); // Dừng lại khi không nhấn nữa
    increaseInterval = null; // Đặt lại biến interval
  };

  // Bắt đầu giảm số lượng khi nhấn và giữ nút trừ
  $scope.startDecreasing = () => {
    if (!decreaseInterval) {
      $scope.decreaseQuantity(); // Giảm ngay lập tức khi click
      decreaseInterval = setInterval(() => {
        if ($scope.quantity > 1) {
          $scope.quantity--;
          $scope.$apply(); // Cập nhật giao diện sau khi thay đổi giá trị
        }
      }, 100); // Giảm liên tục sau mỗi 100ms khi giữ
    }
  };

  // Dừng giảm số lượng khi không còn giữ nút
  $scope.stopDecreasing = () => {
    clearInterval(decreaseInterval); // Dừng lại khi không nhấn nữa
    decreaseInterval = null; // Đặt lại biến interval
  };

  // **8. Yêu thích sản phẩm**
  $scope.toggleHeart = () => {
    if (!$scope.loggedInUser) {
      $scope.showNotification(
        "Vui lòng đăng nhập để sử dụng chức năng yêu thích."
      );
      return;
    }

    if ($scope.isActive) {
      $http
        .delete(`${API}/favorites/${$scope.currentFavoriteId}`)
        .then(() => {
          $scope.isActive = false;
          $scope.currentFavoriteId = null;
          fetchFavoriteData();
        })
        .catch((error) => {
          console.error("Error deleting favorite:", error);
          $scope.showNotification("Lỗi khi xóa yêu thích. Vui lòng thử lại.");
        });
    } else {
      const newFavorite = {
        account: { idaccount: $scope.loggedInUser.idaccount },
        product: { idproduct: productId },
      };

      $http
        .post(`${API}/favorites`, newFavorite)
        .then((response) => {
          $scope.isActive = true;
          $scope.currentFavoriteId = response.data.idfavorite;
          fetchFavoriteData();
        })
        .catch((error) => {
          console.error("Error adding favorite:", error);
          $scope.showNotification("Lỗi khi thêm yêu thích. Vui lòng thử lại.");
        });
    }
  };
  $scope.quickBuy = () => {
    if (!$scope.loggedInUser) {
      $scope.showNotification("Vui lòng đăng nhập để mua sản phẩm.");
      return;
    }

    // Lấy tên hình ảnh từ URL
    const imageName = $scope.product.img.split("/").pop(); // Lấy tên file từ đường dẫn

    // Lấy thông tin sản phẩm cần mua nhanh
    const quickBuyProduct = {
      id: $scope.product.idproduct,
      name: $scope.product.productname,
      image: imageName, // Chỉ lưu tên hình ảnh
      price: $scope.selectedSizeDetail.unitprice,
      quantity: $scope.quantity,
      idproductdetail: $scope.selectedSizeDetail.idproductdetail,
      size: $scope.selectedSizeDetail.size,
      stockQuantity: $scope.selectedSizeDetail.quantityinstock,
    };

    // Lưu sản phẩm vào localStorage để hiển thị trong trang thanh toán
    localStorage.setItem("selectedProducts", JSON.stringify([quickBuyProduct]));

    // Chuyển hướng đến trang thanh toán
    window.location.href = "thanhtoan.html";
  };

  // **Gọi tất cả dữ liệu khi khởi tạo**
  fetchProduct();
  fetchProductDetails();
  fetchFavoriteData();
  fetchCategories();
});
app.controller("DanhGiaSanPhamController", function ($scope, $http) {
  const API = "http://localhost:8080/beesixcake/api";
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  // Biến khởi tạo
  $scope.reviews = [];
  $scope.filteredReviews = []; // Biến lưu trữ đánh giá đã lọc
  $scope.averageRating = 0;
  $scope.reviewCount = 0;

  // Kiểm tra nếu productId không tồn tại
  if (!productId) {
    console.error("Product ID is missing from the URL");
    return;
  }

  // **Lấy đánh giá sản phẩm**
  const fetchReviews = () => {
    $http
      .get(`${API}/reviews`)
      .then((response) => {
        console.log("Response data:", response.data); // Log toàn bộ dữ liệu trả về

        // Lọc đánh giá theo sản phẩm hiện tại
        const productReviews = response.data.filter(
          (review) => review.product.idproduct == productId
        );
        console.log("Filtered Reviews:", productReviews); // Log dữ liệu đã lọc

        // Sắp xếp đánh giá theo ngày, mới nhất lên đầu
        productReviews.sort(
          (a, b) => new Date(b.reviewdate) - new Date(a.reviewdate)
        );

        // Tính toán nếu có đánh giá
        if (productReviews.length > 0) {
          const totalRating = productReviews.reduce(
            (sum, review) => sum + review.rating,
            0
          );
          console.log("Total Rating:", totalRating); // Log tổng số sao

          $scope.averageRating = parseFloat(
            (totalRating / productReviews.length).toFixed(1)
          );
          console.log("Average Rating Calculated:", $scope.averageRating); // Log trung bình số sao

          $scope.reviewCount = productReviews.length;
        } else {
          // Không có đánh giá
          $scope.averageRating = "N/A"; // Hoặc có thể là 0
          $scope.reviewCount = 0;
        }

        // Gán dữ liệu đánh giá
        $scope.reviews = productReviews;
        $scope.filteredReviews = productReviews; // Dữ liệu ban đầu (lọc tất cả)
        $scope.visibleReviews = productReviews.slice(0, 2); // Hiển thị 3 đánh giá đầu tiên
      })
      .catch((error) => console.error("Error fetching reviews:", error));
  };

  // **Lọc đánh giá**
  $scope.selectedFilter = "all"; // Mặc định chọn "Tất cả"

  $scope.filterReviews = function (rating) {
    $scope.selectedFilter = rating; // Cập nhật bộ lọc đã chọn
  
    if (rating === "all") {
      $scope.filteredReviews = $scope.reviews; // Hiển thị tất cả
    } else if (rating === "withComment") {
      $scope.filteredReviews = $scope.reviews.filter((review) => review.reviewtext); // Có bình luận
    } else {
      $scope.filteredReviews = $scope.reviews.filter((review) => review.rating === rating); // Theo số sao
    }
  
    // Cập nhật lại danh sách hiển thị
    $scope.visibleReviews = $scope.filteredReviews.slice(0, 2);  // Hiển thị 3 đánh giá đầu tiên
    $scope.showAll = false; // Reset trạng thái nút "Xem thêm"
  };
  
  // **Hiển thị thêm bình luận**
  $scope.showMoreReviews = function () {
    $scope.showAll = true;
    $scope.visibleReviews = $scope.filteredReviews; // Hiển thị toàn bộ đánh giá sau khi lọc
  };
  
  // **Ẩn bớt bình luận**
  $scope.showLessReviews = function () {
    $scope.showAll = false;
    $scope.visibleReviews = $scope.filteredReviews.slice(0, 2); // Hiển thị lại 3 đánh giá đầu tiên
  };

  // **Tính số lượng đánh giá phù hợp với rating**
  $scope.filterReviewCount = function (rating) {
    if (rating === "all") {
      return $scope.reviews.length;
    } else if (rating === "withComment") {
      return $scope.reviews.filter((review) => review.reviewtext).length;
    } else {
      return $scope.reviews.filter((review) => review.rating === rating).length;
    }
  };

  // Gọi khi khởi tạo controller
  fetchReviews();
});
app.controller("FavoriteTopController", function ($scope, $http) {
  const API = "http://localhost:8080/beesixcake/api";
  const imageBaseUrl = "../admin/images/";

  // Khởi tạo mảng để chứa sản phẩm yêu thích
  $scope.favoriteProducts = [];
  $scope.categories = []; // Mảng lưu danh mục sản phẩm

  // Lấy sản phẩm có lượt yêu thích nhiều nhất từ API
  $scope.getMostFavoritedProducts = function () {
    $http
      .get(`${API}/favorites`)
      .then(function (response) {
        if (!Array.isArray(response.data)) {
          console.error("Dữ liệu không phải mảng!");
          return;
        }

        // Đếm lượt yêu thích cho mỗi sản phẩm
        const favoriteCounts = {};
        response.data.forEach((fav) => {
          const productId = fav.product.idproduct;
          if (!favoriteCounts[productId]) {
            favoriteCounts[productId] = {
              product: fav.product,
              count: 0,
            };
          }
          favoriteCounts[productId].count++;
        });

        // Chuyển đối tượng thành mảng và sắp xếp theo lượt yêu thích giảm dần
        $scope.favoriteProducts = Object.values(favoriteCounts)
          .sort((a, b) => b.count - a.count) // Sắp xếp giảm dần theo count
          .map((item) => {
            const product = item.product;
            product.img = imageBaseUrl + product.img;
            product.favoriteCount = item.count; // Gán số lượt yêu thích
            product.unitprice = null; // Khởi tạo giá mặc định
            return product;
          });

        // Lấy giá thấp nhất cho các sản phẩm yêu thích
        $scope.getProductPrices();
      })
      .catch(function (error) {
        console.error("Error fetching favorite products:", error);
      });
  };

  // Lấy giá thấp nhất của sản phẩm
  $scope.getProductPrices = function () {
    $http
      .get(`${API}/productdetail`)
      .then(function (response) {
        if (!Array.isArray(response.data)) {
          console.error("Dữ liệu không phải mảng từ API chi tiết sản phẩm!");
          return;
        }

        // Tìm giá thấp nhất cho mỗi sản phẩm
        $scope.favoriteProducts.forEach((product) => {
          const productDetails = response.data.filter(
            (detail) => detail.product.idproduct === product.idproduct
          );

          if (productDetails.length > 0) {
            product.unitprice = Math.min(
              ...productDetails.map((detail) => detail.unitprice)
            ); // Tìm giá thấp nhất
          }
        });
      })
      .catch(function (error) {
        console.error("Error fetching product details:", error);
      });
  };

  // Định dạng tiền tệ
  $scope.formatCurrency = function (amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Lấy danh mục sản phẩm và số lượng
  $scope.getCategorie = function () {
    $http
      .get(`${API}/category`)
      .then((response) => {
        $scope.categories = response.data;

        // Khởi tạo số lượng sản phẩm cho mỗi danh mục
        $scope.categories.forEach((category) => {
          category.count = 0; // Mặc định là 0
        });

        // Lấy tất cả sản phẩm để tính số lượng theo danh mục
        $http
          .get(`${API}/product`)
          .then((productResponse) => {
            const products = productResponse.data;

            // Đếm số lượng sản phẩm trong từng danh mục
            products.forEach((product) => {
              const category = $scope.categories.find(
                (cat) => cat.idcategory === product.category.idcategory
              );
              if (category) category.count++;
            });
          })
          .catch((error) => {
            console.error("Error fetching products:", error);
          });
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
      });
  };

  // Gọi hàm để lấy dữ liệu ban đầu
  $scope.getMostFavoritedProducts(); // Gọi để lấy sản phẩm có lượt yêu thích nhiều nhất
  $scope.getCategorie(); // Gọi để lấy danh mục sản phẩm
});
app.controller("loadLoaiSanPham", function ($scope, $http) {
  // Khởi tạo mảng để chứa loại sản phẩm
  $scope.category = [];
  $scope.selectedCategory = ""; // Danh mục được chọn

  // Lấy danh mục sản phẩm
  $scope.getCategories = function () {
    $http
      .get("http://localhost:8080/beesixcake/api/category")
      .then(function (response) {
        if (Array.isArray(response.data)) {
          // Lưu danh mục vào mảng
          $scope.category = response.data.map((item) => ({
            idcategory: item.idcategory,
            categoryname: item.categoryname,
          }));
        } else {
          console.error("Dữ liệu danh mục không phải là mảng!");
        }
      })
      .catch(function (error) {
        console.error("Lỗi khi lấy danh mục sản phẩm:", error);
      });
  };

  // Lọc sản phẩm theo loại (chỉ lưu tên danh mục vào localStorage để dùng sau)
  $scope.filterProducts = function (categoryName, shouldRedirect = true) {
    $scope.selectedCategory = categoryName;

    // Lưu loại sản phẩm vào localStorage
    localStorage.setItem("selectedCategory", categoryName);

    // Chuyển hướng nếu cần
    if (shouldRedirect) {
      window.location.href = "SanPham.html"; // Chuyển đến trang sản phẩm
    }
  };

  // Gọi hàm để tải danh mục sản phẩm ban đầu
  $scope.getCategories();
});
app.controller("CheckLogin", function ($scope, $http, $window, $timeout) {
  // Khởi tạo thông tin người dùng và trạng thái đăng nhập
  $scope.isLoggedIn = false;
  $scope.user = {
    idaccount: "",
    password: "",
  };
  $scope.loginError = ""; // Biến để lưu thông báo lỗi

  // Kiểm tra trạng thái đăng nhập từ localStorage
  if (localStorage.getItem("loggedInUser")) {
    $scope.isLoggedIn = true;
    $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  } else {
    // Không chuyển hướng ở đây, để người dùng vào trang index mà không cần đăng nhập
    $scope.isLoggedIn = false;
    $scope.loggedInUser = null;
  }

  // Hàm cập nhật giao diện
  $scope.updateAccountMenu = function () {
    $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
    $scope.loggedInUser = $scope.isLoggedIn
      ? JSON.parse(localStorage.getItem("loggedInUser"))
      : null;
  };

  // Phương thức đăng nhập
  $scope.login = function () {
    if (!$scope.isLoggedIn) {
      $scope.loginError = ""; // Reset thông báo lỗi

      // Gửi yêu cầu GET để lấy danh sách tài khoản từ API
      $http
        .get("http://localhost:8080/beesixcake/api/account")
        .then(function (response) {
          $scope.accounts = response.data;
          var foundAccount = $scope.accounts.find(
            (account) =>
              account.idaccount === $scope.user.idaccount &&
              account.password === $scope.user.password
          );

          if (foundAccount) {
            if (foundAccount.admin) {
              // Nếu tài khoản là admin
              $scope.loginError = "Bạn không có quyền truy cập!";
            } else {
              // Đăng nhập thành công
              $scope.loginSuccess = "Đăng nhập thành công!";
              // Lưu thông tin đăng nhập vào localStorage
              localStorage.setItem(
                "loggedInUser",
                JSON.stringify(foundAccount)
              );

              // Cập nhật giao diện
              $scope.updateAccountMenu();

              // Chuyển hướng về trang chính ngay lập tức
              $window.location.href = "index.html";
            }
          } else {
            // Nếu tài khoản không đúng hoặc mật khẩu không khớp
            $scope.loginError = "Tên người dùng hoặc mật khẩu không đúng!";
          }
        })
        .catch(function (error) {
          // Xử lý lỗi từ API
          $scope.loginError = "Lỗi khi kết nối đến máy chủ. Vui lòng thử lại.";
          console.error("Error:", error);
        });
    } else {
      alert("Bạn đã đăng nhập rồi.");
    }
  };

  // Phương thức đăng xuất
  $scope.logout = function () {
    localStorage.removeItem("loggedInUser");
    $scope.isLoggedIn = false;
    $scope.loggedInUser = null;
    $window.location.href = "index.html"; // Chuyển về trang chính sau khi đăng xuất
  };

  // Gọi cập nhật giao diện khi controller được khởi tạo
  $scope.updateAccountMenu();
});
