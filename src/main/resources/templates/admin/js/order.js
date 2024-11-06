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

  // Lấy chi tiết đơn hàng
  $scope.refreshOrderDetails = function () {
    $http({
      method: "GET",
      url: API + "/orderdetail",
    })
      .then(function (response) {
        $scope.OrderDetails = response.data;
      })
      .catch(function (error) {
        console.error("Có lỗi xảy ra khi lấy danh sách chi tiết đơn hàng: ", error);
      });
  };

  // Lấy giảm giá
  $scope.refreshOrderDetails = function () {
    $http({
      method: "GET",
      url: API + "/discount",
    })
      .then(function (response) {
        $scope.Discounts = response.data;
      })
      .catch(function (error) {
        console.error("Có lỗi xảy ra khi lấy danh sách chi tiết đơn hàng: ", error);
      });
  };

  // Gọi hàm lấy danh sách đơn hàng và chi tiết khi controller được khởi tạo
  $scope.refreshOrders();
  $scope.refreshOrderDetails();

  // Chọn đơn hàng để chỉnh sửa
  $scope.editOrder = function (order) {
    $scope.selectedOrder = angular.copy(order);
    $scope.originalStatus = angular.copy(order.status.idstatus);
    $scope.selectedOrder.addressdetail = `${order.address.housenumber}, ${order.address.roadname}, ${order.address.ward}, ${order.address.district}, ${order.address.city}`;

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
        message: "Trạng thái Đang xác nhận chỉ có thể chuyển sang Đang giao hàng hoặc Đã hủy.",
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
        message: "Trạng thái Đã hoàn thành không thể quay lại Đang xác nhận hoặc Đang giao hàng.",
      };
    }
    if (oldStatus == 4 && (newStatus == 1 || newStatus == 2 || newStatus == 3)) {
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
      $scope.message = "Cập nhật trạng thái không thành công: " + validationResult.message;
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
        $scope.refreshOrders(); // Refresh orders after status update
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
    return day + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds;
  };

  // Tính tổng tiền của đơn hàng
  $scope.calculateTotalForOrders = function(orderIds) {
    let totalOrderSummary = {};  // Đối tượng lưu tổng tiền của các đơn hàng
    
    // Duyệt qua từng orderId trong mảng orderIds
    angular.forEach(orderIds, function(orderId) {
        let order = $scope.Orders.find(order => order.idorder === orderId);
    
        if (order) {
            let totalOrderDetail = 0;  // Biến lưu tổng tiền của đơn hàng theo chi tiết
    
            // Kiểm tra xem OrderDetails có phải là mảng hay không
            if (Array.isArray($scope.OrderDetails)) {
                // Lọc các chi tiết của đơn hàng theo idOrder
                let orderDetailsForThisOrder = $scope.OrderDetails.filter(function(detail) {
                    return detail.idorder === orderId;
                });

                // Kiểm tra có bao nhiêu chi tiết trong đơn hàng này
                console.log("Các chi tiết đơn hàng cho orderId " + orderId + ":", orderDetailsForThisOrder);
    
                // Duyệt qua các chi tiết của đơn hàng
                angular.forEach(orderDetailsForThisOrder, function(detail) {
                    if (detail.productdetail && detail.productdetail.unitprice) {
                        // Tính tổng tiền của chi tiết đơn hàng: unitprice * quantity
                        let detailTotal = detail.productdetail.unitprice * detail.quantity;
                        totalOrderDetail += detailTotal;  // Cộng vào tổng tiền của đơn hàng
                    } else {
                        console.error('Unit price is undefined for product ID:', detail.productdetail.product.idproduct);
                    }
                });
            } else {
                console.error('OrderDetails is not an array or is undefined');
            }
    
            // Lấy phí vận chuyển, nếu không có thì mặc định là 0
            let shipFee = order.shipfee || 0;
    
            // Lấy giảm giá (LowestPrice), nếu không có thì mặc định là 0
            let discountAmount = order.discount && order.discount.LowestPrice ? order.discount.LowestPrice : 0;
    
            // Tính tổng tiền cuối cùng của đơn hàng
            let totalOrder = totalOrderDetail + shipFee - discountAmount;
    
            // Lưu tổng tiền của đơn hàng vào đối tượng summary với key là idorder
            totalOrderSummary[orderId] = totalOrder;
        } else {
            console.error('Không tìm thấy đơn hàng với idOrder:', orderId);
        }
    });
    
    // Hiển thị tổng tiền của tất cả các đơn hàng trong console
    console.log("Tổng tiền cho từng đơn hàng:", totalOrderSummary);
    return totalOrderSummary;  // Trả về đối tượng chứa tổng tiền của các đơn hàng
};


});
