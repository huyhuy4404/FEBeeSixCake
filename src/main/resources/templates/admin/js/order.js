var app = angular.module("myApp", ["ngRoute"]);

const API = "http://localhost:8080/beesixcake/api";

app.controller("OrderController", function ($scope, $http) {
  // Lấy danh sách đơn hàng
  $scope.refreshOrders = function () {
    $http({
      method: "GET",
      url: API + "/order",
    })
      .then(function (response) {
        $scope.Orders = response.data;
      })
      .catch(function (error) {
        console.error("Có lỗi xảy ra khi lấy danh sách đơn hàng: ", error);
      });
  };

  $scope.refreshOrders();

  // Chọn đơn hàng để chỉnh sửa
  $scope.editOrder = function (order) {
    $scope.selectedOrder = angular.copy(order);
    $scope.originalStatus = angular.copy(order.status.idstatus);
    $scope.selectedOrder.fullAddress = `${order.address.housenumber}, ${order.address.roadname}, ${order.address.ward}, ${order.address.district}, ${order.address.city}`;

    // Gọi hàm để lấy chi tiết đơn hàng
    $scope.getOrderDetails(order.idorder);

    $scope.message = "Tải dữ liệu thành công!";
    $scope.messageType = "success";

    var editTab = new bootstrap.Tab(document.getElementById("edit-tab"));
    editTab.show();
  };

  // Hàm kiểm tra điều kiện chuyển đổi trạng thái
  function isValidStatusChange(oldStatus, newStatus) {
    if (oldStatus == 1 && newStatus != 2 && newStatus != 4) {
      return {
        isValid: false,
        message:
          "Trạng thái Đang xác nhận chỉ có thể chuyển sang Đang giao hàng hoặc Đã hủy.",
      };
    }
    if (oldStatus == 2 && newStatus == 1) {
      return {
        isValid: false,
        message: "Trạng thái Đang giao hàng không thể quay lại Đang xác nhận.",
      };
    }
    if (oldStatus == 3 && (newStatus == 1 || newStatus == 2)) {
      return {
        isValid: false,
        message:
          "Trạng thái Đã hoàn thành không thể quay lại Đang xác nhận hoặc Đang giao hàng.",
      };
    }
    if (
      oldStatus == 4 &&
      (newStatus == 1 || newStatus == 2 || newStatus == 3)
    ) {
      return {
        isValid: false,
        message: "Trạng thái Đã hủy không thể chuyển về các trạng thái khác.",
      };
    }
    return { isValid: true }; // Các điều kiện hợp lệ
  }

  // Cập nhật trạng thái đơn hàng
  $scope.updateOrderStatus = function () {
    var newStatus = $scope.selectedOrder.status.idstatus;
    var oldStatus = $scope.originalStatus;

    // Kiểm tra điều kiện trước khi cập nhật
    var validationResult = isValidStatusChange(oldStatus, newStatus);
    if (!validationResult.isValid) {
      $scope.message =
        "Cập nhật trạng thái không thành công: " + validationResult.message;
      $scope.messageType = "error";
      return;
    }

    // Nếu điều kiện hợp lệ, thực hiện cập nhật
    var updatedOrder = {
      idorder: $scope.selectedOrder.idorder,
      orderdate: $scope.selectedOrder.orderdate,
      totalamount: $scope.selectedOrder.totalamount,
      account: $scope.selectedOrder.account,
      status: {
        idstatus: newStatus,
      },
      address: $scope.selectedOrder.address,
      discount: $scope.selectedOrder.discount,
      payment: $scope.selectedOrder.payment,
    };

    $http
      .put(API + `/order/${updatedOrder.idorder}`, updatedOrder)
      .then(function (response) {
        $scope.message = "Cập nhật trạng thái thành công!";
        $scope.messageType = "success";
        $scope.refreshOrders();
      })
      .catch(function (error) {
        $scope.message = "Có lỗi xảy ra khi cập nhật trạng thái!";
        $scope.messageType = "error";
      });
  };

  // Định dạng hiển thị thời gian
  $scope.formatDate = function (dateString) {
    var date = new Date(dateString);
    var day = ("0" + date.getDate()).slice(-2);
    var month = ("0" + (date.getMonth() + 1)).slice(-2);
    var year = date.getFullYear();
    var hours = ("0" + date.getHours()).slice(-2);
    var minutes = ("0" + date.getMinutes()).slice(-2);
    var seconds = ("0" + date.getSeconds()).slice(-2);
    return (
      day +
      "-" +
      month +
      "-" +
      year +
      " " +
      hours +
      ":" +
      minutes +
      ":" +
      seconds
    );
  };

  // Gọi chi tiết đơn hàng khi người dùng nhấp vào nút "Chi Tiết"
  $scope.showOrderDetails = function (order) {
    // Gọi API để lấy chi tiết đơn hàng
    $scope.getOrderDetails(order.idorder);

    $scope.selectedOrder = angular.copy(order);
    var modalElement = document.getElementById(
      "modal-" + $scope.selectedOrder.idorder
    );
    var modal = new bootstrap.Modal(modalElement);
    modal.show();
  };

  // Hàm lấy chi tiết đơn hàng và sản phẩm
  $scope.getOrderDetails = function (orderId) {
    $http({
      method: "GET",
      url: API + "/orderdetail?orderId=" + orderId,
    })
      .then(function (response) {
        console.log(response.data); // Kiểm tra dữ liệu nhận được
        const order = $scope.Orders.find((o) => o.idorder === orderId);
        if (order) {
          order.details = response.data;
          order.details.forEach((detail) => {
            detail.product = detail.productdetail.product;
            detail.size = detail.productdetail.size;
  
            // Gán đường dẫn ảnh mới
            if (detail.product) {
              detail.product.img = `https://5ck6jg.csb.app/anh/${detail.product.img}`;
            }
  
            if (!detail.product) {
              $http({
                method: "GET",
                url: API + `/product/${detail.productdetail.idproduct}`,
              })
                .then(function (productResponse) {
                  detail.product = productResponse.data;
                  detail.product.img = `https://5ck6jg.csb.app/anh/${detail.product.img}`;
                })
                .catch(function (error) {
                  console.error(
                    "Có lỗi xảy ra khi lấy thông tin sản phẩm: ",
                    error
                  );
                });
            }
  
            // Định dạng giá thành VNĐ
            if (detail.product && detail.product.price) {
              detail.product.priceFormatted = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(detail.product.price);
            }
          });
        }
      })
      .catch(function (error) {
        console.error("Có lỗi xảy ra khi lấy chi tiết đơn hàng: ", error);
      });
  };
  
});
