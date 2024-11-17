var app = angular.module("myApp", ["ngRoute"]);

const API = "http://localhost:8080/beesixcake/api";

app.controller("OrderController", function ($scope, $window, $http) {
    // Khởi tạo các biến
    $scope.Orders = [];
    $scope.filteredOrders = [];
    $scope.paginatedOrders = [];
    $scope.pages = [];
    $scope.currentPage = 1;
    $scope.itemsPerPage = 5;
    $scope.searchQuery = "";
    $scope.message = "";
    $scope.messageType = "";
    $scope.isUpdating = false;
    $scope.orderDetails = [];
    $scope.selectedOrder = {};
    $scope.originalStatus = null;
    $scope.originalPaymentStatus = null;

    // Định nghĩa base URL cho hình ảnh
    $scope.imageBaseUrl = "https://5ck6jg.csb.app/anh/"; // Đảm bảo base URL là đúng

    // Tải danh sách đơn hàng và cập nhật trạng thái
    $scope.loadOrders = function () {
        $http
            .get(API + "/order")
            .then((response) => {
                $scope.Orders = response.data;
                $scope.Orders.forEach((order) => {
                    // Nếu có sản phẩm và hình ảnh, gán đúng URL
                    if (order.product && order.product.img) {
                        order.product.img = $scope.imageBaseUrl + order.product.img.split("/").pop();
                    }
                });
                $scope.refreshOrderStatusHistory(); // Cập nhật lịch sử trạng thái cho mỗi đơn hàng
            })
            .catch((error) => {
                console.error("Có lỗi xảy ra khi lấy danh sách đơn hàng: ", error);
            });
    };

    // Lấy chi tiết đơn hàng cho một đơn hàng cụ thể
    $scope.getOrderDetails = function (idorder) {
        $http
            .get(`${API}/orderdetail/order/${idorder}`)
            .then((response) => {
                $scope.orderDetails = response.data;
                $scope.orderDetails.forEach((detail) => {
                    if (detail.product && detail.product.img) {
                        detail.product.img = $scope.imageBaseUrl + detail.product.img.split("/").pop();
                    }
                });
            })
            .catch((error) => {
                console.error("Có lỗi xảy ra khi lấy chi tiết đơn hàng: ", error);
            });
    };

    $scope.loadOrderDetailsByIdOrder = function (idorder) {
        const url = `${API}/orderdetail/order/${idorder}`;
        $http
            .get(url)
            .then((response) => {
                $scope.selectedOrderDetails = response.data; // Gán dữ liệu vào selectedOrderDetails
                
                // Duyệt qua từng chi tiết đơn hàng và log ra console
                $scope.selectedOrderDetails.forEach((detail) => {
                    const idOrderDetail = detail.idorderdetail || "N/A";
                    const unitPrice = detail.productdetail ? detail.productdetail.unitprice : "Không có giá";
                    const quantity = detail.quantity || "Không có số lượng";
    
                    console.log(`idorderdetail: ${idOrderDetail}, unitprice: ${unitPrice}, quantity: ${quantity}`);
                });
            })
            .catch((error) => {
                console.error("Có lỗi xảy ra khi tải dữ liệu orderdetail:", error);
            });
    };
    
    
    //Tính tổng tiền sản phẩm
    $scope.calculateTotalProductPrice = function () {
        if (!$scope.selectedOrderDetails || !$scope.selectedOrderDetails.length) {
            return 0;
        }
        return $scope.selectedOrderDetails.reduce((total, detail) => {
            const quantity = detail.quantity || 0;
            const unitPrice = detail.productdetail ? detail.productdetail.unitprice : 0;
            return total + (quantity * unitPrice);
        }, 0);
    };

    // Lấy lịch sử trạng thái đơn hàng và cập nhật trạng thái hiện tại
    $scope.refreshOrderStatusHistory = function () {
        $http
            .get(API + "/order-status-history")
            .then((response) => {
                const statusHistories = response.data;
                $scope.Orders.forEach((order) => {
                    const orderHistory = statusHistories
                        .filter((history) => history.order.idorder === order.idorder)
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    if (orderHistory.length) {
                        order.statusName = orderHistory[0].status.statusname;
                        order.status = orderHistory[0].status; // Cập nhật trạng thái trực tiếp vào order
                        order.statuspay = order.statuspay || order.status.statuspay; // Đảm bảo có trạng thái thanh toán
                    } else {
                        // Nếu không có lịch sử, sử dụng thông tin hiện tại từ order
                        order.statusName = order.statuspay.statuspayname;
                    }
                });
                $scope.$applyAsync(); // Đảm bảo AngularJS nhận diện sự thay đổi
                $scope.updatePagination();
            })
            .catch((error) => {
                console.error("Có lỗi xảy ra khi lấy trạng thái từ order-status-history: ", error);
            });
    };

    // Cập nhật trạng thái đơn hàng với điều kiện kiểm tra chuyển đổi hợp lệ
    $scope.updateOrderStatus = function () {
        $scope.isUpdating = true; // Bật trạng thái đang cập nhật

        var newStatus = parseInt($scope.selectedOrder.status.idstatus, 10);
        var oldStatus = parseInt($scope.originalStatus, 10);

        // Kiểm tra nếu trạng thái không thay đổi
        if (oldStatus === newStatus) {
            $scope.message = "Trạng thái không thay đổi.";
            $scope.messageType = "info";
            $scope.isUpdating = false;
            return;
        }

        // Kiểm tra điều kiện chuyển đổi trạng thái hợp lệ
        var validationResult = isValidStatusChange(oldStatus, newStatus);

        if (!validationResult.isValid) {
            $scope.message =
                "Cập nhật trạng thái không thành công: " + validationResult.message;
            $scope.messageType = "error";
            $scope.isUpdating = false;
            return;
        }

        // Tạo đối tượng order-status-history mới
        var orderStatusHistory = {
            order: { idorder: $scope.selectedOrder.idorder },
            status: { idstatus: newStatus },
            timestamp: new Date().toISOString(),
        };

        // Gửi yêu cầu PUT để cập nhật trạng thái lên server
        $http
            .put(`${API}/order-status-history/${$scope.selectedOrder.idorder}`, orderStatusHistory)
            .then((response) => {
                $scope.message = "Cập nhật trạng thái thành công!";
                $scope.messageType = "success";

                // Cập nhật trạng thái trực tiếp trong $scope.selectedOrder
                $scope.selectedOrder.status.idstatus = newStatus;

                // Cập nhật trong danh sách Orders
                const orderIndex = $scope.Orders.findIndex(
                    (order) => order.idorder === $scope.selectedOrder.idorder
                );
                if (orderIndex !== -1) {
                    $scope.Orders[orderIndex].status.idstatus = newStatus;
                    $scope.Orders[orderIndex].statusName = response.data.statusName;
                }
            })
            .catch((error) => {
                $scope.message = "Có lỗi xảy ra khi cập nhật trạng thái!";
                $scope.messageType = "error";
                console.error("Error updating order status: ", error);
            })
            .finally(() => {
                $scope.isUpdating = false;
            });
    };

    // Cập nhật trạng thái thanh toán
    $scope.updateOrderStatusPay = function () {
        // Kiểm tra trạng thái hiện tại trước khi cập nhật
        if ($scope.originalPaymentStatus !== 1) {
            $scope.message = "Chỉ có thể cập nhật trạng thái thanh toán từ 'Chưa Thanh Toán' sang 'Đã Thanh Toán'.";
            $scope.messageType = "error";
            return;
        }

        // Kiểm tra xem người dùng đã chọn 'Đã Thanh Toán' hay chưa
        if ($scope.selectedOrder.statuspay.idstatuspay !== 2) {
            $scope.message = "Bạn chỉ có thể chuyển trạng thái thanh toán sang 'Đã Thanh Toán'.";
            $scope.messageType = "error";
            return;
        }

        $scope.isUpdating = true; // Bật trạng thái đang cập nhật

        // Tạo payload chỉ chứa idstatuspay với giá trị mới
        var updatedPayment = {
            idstatuspay: 2
        };

        $http
            .put(`${API}/order/${$scope.selectedOrder.idorder}`, updatedPayment)
            .then((response) => {
                $scope.message = "Cập nhật trạng thái thanh toán thành công!";
                $scope.messageType = "success";
                $scope.loadOrders();
            })
            .catch((error) => {
                console.error("Có lỗi xảy ra khi cập nhật trạng thái thanh toán: ", error);
                if (error.data && error.data.error === 'Mã giảm giá không tồn tại.') {
                    // Hiển thị thông báo lỗi cho người dùng
                    $scope.message = "Không thể cập nhật thanh toán vì mã giảm giá không tồn tại.";
                    $scope.messageType = "error";
                } else {
                    $scope.message = "Có lỗi xảy ra khi cập nhật thanh toán!";
                    $scope.messageType = "error";
                }
            })
            .finally(() => {
                $scope.isUpdating = false;
            });
    };

    // Hàm kiểm tra điều kiện chuyển đổi trạng thái
    function isValidStatusChange(oldStatus, newStatus) {
        if (oldStatus === 1 && (newStatus === 2 || newStatus === 4)) {
            return { isValid: true };
        } else if (oldStatus === 2 && (newStatus === 3 || newStatus === 4)) {
            return { isValid: true };
        } else if (oldStatus === 3) {
            return {
                isValid: false,
                message:
                    "Trạng thái 'Đã Giao Hàng' không thể cập nhật sang trạng thái khác.",
            };
        } else if (oldStatus === 4) {
            return {
                isValid: false,
                message: "Trạng thái 'Đã Hủy' không thể cập nhật sang trạng thái khác.",
            };
        } else {
            return { isValid: false, message: "Trạng thái không hợp lệ." };
        }
    }

    // Hàm mở modal đơn hàng
    $scope.openOrderModal = function (order) {
        $scope.selectedOrder = angular.copy(order); // Đảm bảo giữ lại bản sao đơn hàng
        console.log("selectedOrder.idstatuspay", $scope.selectedOrder.statuspay.idstatuspay); // Kiểm tra giá trị tại đây
        $scope.originalStatus = order.status.idstatus; // Lưu trạng thái ban đầu của đơn hàng
        $scope.originalPaymentStatus = order.statuspay.idstatuspay; // Lưu trạng thái thanh toán ban đầu
        if (
            $scope.selectedOrder.statuspay.idstatuspay !== 1 &&
            $scope.selectedOrder.statuspay.idstatuspay !== 2
        ) {
            $scope.selectedOrder.statuspay.idstatuspay = 1; // Thiết lập giá trị mặc định là 1 nếu không hợp lệ
        }
        $scope.getOrderDetails(order.idorder);
        $scope.loadOrderDetailsByIdOrder(order.idorder); // Tải dữ liệu chi tiết đơn hàng
    };

    // Định dạng thời gian hiển thị
    $scope.formatDate = function (dateString) {
        var date = new Date(dateString);
        return date.toLocaleString("vi-VN", { hour12: false });
    };

    // Phân trang
    $scope.updatePagination = function () {
        // Apply search filter
        if ($scope.searchQuery) {
            $scope.filteredOrders = $scope.Orders.filter(function (order) {
                return order.idorder.toString().includes($scope.searchQuery) ||
                    (order.statusName && order.statusName.toLowerCase().includes($scope.searchQuery.toLowerCase()));
            });
        } else {
            $scope.filteredOrders = $scope.Orders || [];
        }

        // Calculate total pages
        $scope.totalPages =
            Math.ceil(($scope.filteredOrders ? $scope.filteredOrders.length : 0) / $scope.itemsPerPage) || 1;

        // Create an array of pages
        $scope.pages = [];
        for (var i = 1; i <= $scope.totalPages; i++) {
            $scope.pages.push(i);
        }

        // Adjust current page if it exceeds total pages
        if ($scope.currentPage > $scope.totalPages) {
            $scope.currentPage = $scope.totalPages;
        }

        // Get the orders for the current page
        var start = ($scope.currentPage - 1) * $scope.itemsPerPage;
        var end = start + $scope.itemsPerPage;
        $scope.paginatedOrders = ($scope.filteredOrders || []).slice(start, end);
    };

    // Page change function
    $scope.goToPage = function (page) {
        if (page < 1 || page > $scope.totalPages) {
            return;
        }
        $scope.currentPage = page;
        $scope.updatePagination();
    };

    // Watch for changes in Orders or searchQuery to update pagination
    $scope.$watchGroup(
        ["Orders", "searchQuery"],
        function (newValues, oldValues) {
            $scope.currentPage = 1; // Reset to page 1 khi dữ liệu thay đổi
            $scope.updatePagination();
        }
    );

    // Reload trang khi modal bị đóng
    $(document).on("hide.bs.modal", ".modal", function () {
        $window.location.reload(); // Reload toàn bộ trang
    });

    // Khởi tạo dữ liệu
    $scope.loadOrders();
});
