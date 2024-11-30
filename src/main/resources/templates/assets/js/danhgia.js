var app = angular.module("myApp", []);
document.addEventListener("DOMContentLoaded", function () {
  const stars = document.querySelectorAll(".rating .star");
  let selectedRating = 0;

  stars.forEach((star) => {
    star.addEventListener("mouseenter", function () {
      const currentValue = parseInt(star.getAttribute("data-value"));
      highlightStars(currentValue);
    });

    star.addEventListener("mouseleave", function () {
      highlightStars(selectedRating);
    });

    star.addEventListener("click", function () {
      selectedRating = parseInt(star.getAttribute("data-value"));
      highlightStars(selectedRating);
      console.log("Giá trị đánh giá: ", selectedRating);
    });
  });

  // Hàm hiển thị màu sắc của các sao
  function highlightStars(rating) {
    stars.forEach((star) => {
      const starValue = parseInt(star.getAttribute("data-value"));
      if (starValue <= rating) {
        star.classList.add("selected");
      } else {
        star.classList.remove("selected");
      }
    });
  }
});
// Tạo một controller mới với tên 'loadSanPhamDanhGia'
app.controller("loadSanPhamDanhGia", function ($scope, $http) {
  const API = "http://localhost:8080/beesixcake/api"; // API của bạn
  const productId = new URLSearchParams(window.location.search).get("id"); // Lấy ID từ URL

  // Kiểm tra nếu có ID sản phẩm
  if (productId) {
    // Lấy thông tin sản phẩm từ API
    $http
      .get(`${API}/product/${productId}`)
      .then(function (response) {
        $scope.product = response.data; // Gán dữ liệu sản phẩm vào scope
        $scope.product.img = imageBaseUrl + $scope.product.img.split("/").pop(); // Chỉnh sửa đường dẫn ảnh nếu cần
      })
      .catch(function (error) {
        console.error("Error loading product data:", error); // Xử lý lỗi nếu có
      });

    // Lấy đánh giá sản phẩm từ API
    $http
      .get(`${API}/reviews/${productId}`)
      .then(function (response) {
        $scope.reviews = response.data; // Gán dữ liệu đánh giá vào scope
      })
      .catch(function (error) {
        console.error("Error loading product reviews:", error); // Xử lý lỗi nếu có
      });
  } else {
    console.log("Product ID is missing!");
  }
});
