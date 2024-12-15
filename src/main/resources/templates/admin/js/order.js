var app = angular.module("myApp", ["ngRoute"]);

const API = "http://localhost:8080/beesixcake/api";
app.controller("OrderController", function ($scope, $window, $http) {
  // Khởi tạo các biến
  $scope.Orders = [];
  $scope.filteredOrders = [];
  $scope.paginatedOrders = [];
  $scope.pages = [];
  $scope.currentPage = 1;
  $scope.itemsPerPage = 8;
  $scope.searchQuery = "";
  $scope.message = "";
  $scope.messageType = "";
  $scope.isUpdating = false;
  $scope.orderDetails = [];
  $scope.selectedOrder = {};
  $scope.originalStatus = null;
  $scope.originalPaymentStatus = null;

  // Định nghĩa base URL cho hình ảnh
  $scope.imageBaseUrl = "https://5ck6jg.csb.app/anh/";

  //Lọc đơn hàng theo trạng thái

  // Hàm hiển thị modal thông báo
  $scope.showMessageModal = function (message, type) {
    $scope.message = message;
    $scope.messageType = type;

    // Hiển thị modal thông báo
    const messageModal = new bootstrap.Modal(
      document.getElementById("messageModal"),
      {
        keyboard: true,
        backdrop: "static",
      }
    );
    messageModal.show();
  };

  // Thêm phương thức để cộng thêm 5 giờ vào order.orderdate
  $scope.addHoursToOrderDate = function (orderDate, hoursToAdd) {
    if (!orderDate) return null;

    // Tạo đối tượng Date từ orderDate
    const orderDateObj = new Date(orderDate);

    // Cộng thêm 5 giờ (5 * 60 * 60 * 1000 ms)
    orderDateObj.setHours(orderDateObj.getHours() + hoursToAdd);

    return orderDateObj;
  };

  // Tải danh sách đơn hàng và cập nhật trạng thái
  $scope.loadOrders = function () {
    $http
      .get(API + "/order")
      .then((response) => {
        $scope.Orders = response.data;

        $scope.Orders.forEach((order) => {
          if (order.product && order.product.img) {
            order.product.img =
              $scope.imageBaseUrl + order.product.img.split("/").pop();
          }
        });
        $scope.refreshOrderStatusHistory();
      })
      .catch((error) => {
        console.error("Có lỗi xảy ra khi lấy danh sách đơn hàng: ", error);
        $scope.showMessageModal("Không thể tải danh sách đơn hàng!", "error");
      });
  };

  // Lấy chi tiết đơn hàng
  $scope.getOrderDetails = function (idorder) {
    $http
      .get(`${API}/orderdetail/order/${idorder}`)
      .then((response) => {
        $scope.orderDetails = response.data;
        $scope.orderDetails.forEach((detail) => {
          if (detail.product && detail.product.img) {
            detail.product.img =
              $scope.imageBaseUrl + detail.product.img.split("/").pop();
          }
        });
      })
      .catch((error) => {
        console.error("Có lỗi xảy ra khi lấy chi tiết đơn hàng: ", error);
        $scope.showMessageModal("Không thể tải chi tiết đơn hàng!", "error");
      });
  };
  // Tính tổng tiền sản phẩm
  $scope.calculateTotalProductPrice = function () {
    if (!$scope.orderDetails || !$scope.orderDetails.length) {
      return 0;
    }
    return $scope.orderDetails.reduce((total, detail) => {
      const quantity = detail.quantity || 0; // Số lượng sản phẩm
      const unitPrice = detail.productdetail
        ? detail.productdetail.unitprice || 0
        : 0; // Giá từng sản phẩm
      return total + quantity * unitPrice;
    }, 0);
  };

  // Tính tiền giảm giá
  $scope.calculateDiscount = function () {
    const totalProductPrice = $scope.calculateTotalProductPrice();
    const shipFee = $scope.selectedOrder.shipfee || 0; // Phí vận chuyển
    const totalOrderPrice = $scope.selectedOrder.total || 0; // Tổng tiền đơn hàng

    return totalProductPrice + shipFee - totalOrderPrice;
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
            order.status = orderHistory[0].status;
            order.statuspay = order.statuspay || order.status.statuspay;
          } else {
            order.statusName = order.statuspay.statuspayname;
          }
        });
        $scope.updatePagination();
      })
      .catch((error) => {
        console.error(
          "Có lỗi xảy ra khi lấy trạng thái từ order-status-history: ",
          error
        );
        $scope.showMessageModal(
          "Không thể tải lịch sử trạng thái đơn hàng!",
          "error"
        );
      });
  };

  // Cập nhật trạng thái đơn hàng
  $scope.updateOrderStatus = function () {
    $scope.isUpdating = true;
  
    var newStatus = parseInt($scope.selectedOrder.status.idstatus, 10);
    var oldStatus = parseInt($scope.originalStatus, 10);
  
    if (oldStatus === newStatus) {
      $scope.showMessageModal("Trạng thái không thay đổi.", "info");
      $scope.isUpdating = false;
      return;
    }
  
    var orderStatusHistory = {
      order: { idorder: $scope.selectedOrder.idorder },
      status: { idstatus: newStatus },
      timestamp: new Date().toISOString(),
    };
  
    $http
      .put(`${API}/order-status-history/${$scope.selectedOrder.idorder}`, orderStatusHistory)
      .then((response) => {
        $scope.showMessageModal("Cập nhật trạng thái thành công!", "success");
  
        // Cập nhật trạng thái trong $scope
        $scope.selectedOrder.status.idstatus = newStatus;
  
        const orderIndex = $scope.Orders.findIndex(
          (order) => order.idorder === $scope.selectedOrder.idorder
        );
        if (orderIndex !== -1) {
          $scope.Orders[orderIndex].status.idstatus = newStatus;
          $scope.Orders[orderIndex].statusName = response.data.statusName;
        }
  
        // Nếu trạng thái mới là "Đã Hủy" (idstatus = 4), khôi phục tồn kho
        if (newStatus === 4) {
          $scope.restoreInventory($scope.selectedOrder.idorder);
        }
  
        // Kiểm tra nếu trạng thái mới là "Đã giao hàng" (idstatus = 3)
        if (
          newStatus === 3 &&
          $scope.selectedOrder.statuspay.idstatuspay !== 2 // Chỉ khi trạng thái thanh toán chưa phải "Đã Thanh Toán"
        ) {
          $scope.updateOrderStatusPay(); // Gọi cập nhật trạng thái thanh toán
        }
      })
      .catch((error) => {
        console.error("Có lỗi xảy ra khi cập nhật trạng thái!", error);
        $scope.showMessageModal(
          "Không thể cập nhật trạng thái đơn hàng!",
          "error"
        );
      })
      .finally(() => {
        $scope.isUpdating = false;
      });
  };
  //Thêm sản phẩm tồn kho khi đơn hàng hủy
  $scope.restoreInventory = function (idorder) {
    $http
      .get(`${API}/orderdetail/order/${idorder}`)
      .then((response) => {
        const orderDetails = response.data;
  
        orderDetails.forEach((detail) => {
          if (detail.productdetail && detail.quantity) {
            const productDetail = angular.copy(detail.productdetail);
  
            // Kiểm tra và xử lý giá trị tồn kho
            const quantityInStock = parseInt(productDetail.quantityinstock, 10) || 0;
            const quantityToRestore = parseInt(detail.quantity, 10) || 0;
  
            productDetail.quantityinstock = quantityInStock + quantityToRestore;
  
            console.log(
              `Khôi phục tồn kho: Sản phẩm ${productDetail.idproductdetail}, Tồn kho mới: ${productDetail.quantityinstock}`
            );
  
            $http
              .put(`${API}/productdetail/${productDetail.idproductdetail}`, productDetail)
              .then(() => {
                console.log(
                  `Đã khôi phục tồn kho cho sản phẩm ${productDetail.idproductdetail}`
                );
              })
              .catch((error) => {
                console.error(
                  `Có lỗi khi khôi phục tồn kho cho sản phẩm ${productDetail.idproductdetail}: `,
                  error
                );
              });
          } else {
            console.warn("Chi tiết đơn hàng thiếu dữ liệu hoặc không hợp lệ:", detail);
          }
        });
      })
      .catch((error) => {
        console.error("Có lỗi xảy ra khi lấy chi tiết đơn hàng:", error);
      });
  };
  
  

  // Cập nhật trạng thái thanh toán
  $scope.updateOrderStatusPay = function () {
    if ($scope.selectedOrder.statuspay.idstatuspay === 2) {
      $scope.showMessageModal(
        "Đơn hàng đã ở trạng thái 'Đã Thanh Toán'.",
        "info"
      );
      return;
    }

    if ($scope.originalPaymentStatus !== 1) {
      $scope.showMessageModal(
        "Chỉ có thể cập nhật trạng thái thanh toán từ 'Chưa Thanh Toán' sang 'Đã Thanh Toán'.",
        "error"
      );
      return;
    }

    $scope.isUpdating = true;

    var updatedOrder = angular.copy($scope.selectedOrder);

    if (updatedOrder.discount === null) {
      updatedOrder.discount = {
        iddiscount: 0,
      };
    }

    updatedOrder.statuspay.idstatuspay = 2;
    updatedOrder.statuspay.statuspayname = "Đã Thanh Toán";

    $http
      .put(`${API}/order/${updatedOrder.idorder}`, updatedOrder)
      .then((response) => {
        $scope.showMessageModal("Cập nhật trạng thái thành công!", "success");

        const orderIndex = $scope.Orders.findIndex(
          (order) => order.idorder === $scope.selectedOrder.idorder
        );
        if (orderIndex !== -1) {
          $scope.Orders[orderIndex].statuspay.idstatuspay = 2;
          $scope.Orders[orderIndex].statuspay.statuspayname = "Đã Thanh Toán";
        }

        $scope.selectedOrder.statuspay.idstatuspay = 2;
        $scope.selectedOrder.statuspay.statuspayname = "Đã Thanh Toán";

        $scope.originalPaymentStatus = 2;
      })
      .catch((error) => {
        console.error(
          "Có lỗi xảy ra khi cập nhật trạng thái thanh toán!",
          error
        );
        $scope.showMessageModal(
          "Không thể cập nhật trạng thái thanh toán!",
          "error"
        );
      })
      .finally(() => {
        $scope.isUpdating = false;
      });
  };

  // Hàm mở modal đơn hàng
  $scope.openOrderModal = function (order) {
    $scope.selectedOrder = angular.copy(order); // Sao chép thông tin đơn hàng
    $scope.originalStatus = order.status.idstatus; // Lưu trạng thái ban đầu
    $scope.originalPaymentStatus = order.statuspay.idstatuspay; // Lưu trạng thái thanh toán ban đầu
    
    // Kiểm tra idrole và quyết định hiển thị thông tin khách hàng
    if (order.account.idrole === 1) {
      // Nếu bán tại quầy, không hiển thị thông tin khách hàng
      $scope.showCustomerInfo = false;
    } else if (order.account.idrole === 2) {
      // Nếu bán online, hiển thị thông tin khách hàng
      $scope.showCustomerInfo = true;
    }
  
    $scope.getOrderDetails(order.idorder); // Lấy chi tiết đơn hàng
  
    // Đồng bộ AngularJS với giao diện
    $scope.$applyAsync();
  };
  
  // Sửa lại modal trong HTML để hiển thị/ẩn thông tin khách hàng dựa vào biến showCustomerInfo
  

  // Hàm phân trang
  $scope.updatePagination = function () {
    // Sắp xếp các đơn hàng theo ngày giảm dần
    $scope.filteredOrders = $scope.Orders.sort(function (a, b) {
      return new Date(b.orderdate) - new Date(a.orderdate);
    });
  
    // Lọc theo tìm kiếm (searchQuery)
    if ($scope.searchQuery) {
      const query = $scope.searchQuery.toLowerCase();
      $scope.filteredOrders = $scope.filteredOrders.filter(function (order) {
        return (
          order.idorder.toString().includes(query) || // Lọc theo ID đơn hàng
          (order.statusName && order.statusName.toLowerCase().includes(query)) || // Lọc theo tên trạng thái đơn hàng
          (order.account && order.account.fullname && order.account.fullname.toLowerCase().includes(query)) // Lọc theo tên khách hàng
        );
      });
    }
  
    // Lọc theo trạng thái đơn hàng (selectedStatus)
    if ($scope.selectedStatus) {
      $scope.filteredOrders = $scope.filteredOrders.filter(function (order) {
        return order.statusName === $scope.selectedStatus;
      });
    }
  
    // Lọc theo trạng thái thanh toán (selectedPaymentStatus)
    if ($scope.selectedPaymentStatus) {
      $scope.filteredOrders = $scope.filteredOrders.filter(function (order) {
        return (
          order.statuspay &&
          order.statuspay.statuspayname === $scope.selectedPaymentStatus
        );
      });
    }
  
    // Lọc theo hình thức bán (selectedIdRole)
    if ($scope.selectedIdRole) {
      $scope.filteredOrders = $scope.filteredOrders.filter(function (order) {
        return order.account && order.account.idrole == $scope.selectedIdRole;
      });
    }
  
    // Tính tổng số trang
    $scope.totalPages =
      Math.ceil(
        ($scope.filteredOrders ? $scope.filteredOrders.length : 0) / $scope.itemsPerPage
      ) || 1;
  
    // Điều chỉnh trang hiện tại nếu vượt quá tổng số trang
    if ($scope.currentPage > $scope.totalPages) {
      $scope.currentPage = $scope.totalPages;
    }
  
    // Tạo danh sách các trang
    $scope.pages = [];
    for (var i = 1; i <= $scope.totalPages; i++) {
      $scope.pages.push(i);
    }
  
    // Xác định phạm vi các đơn hàng hiển thị trên trang hiện tại
    const start = ($scope.currentPage - 1) * $scope.itemsPerPage;
    const end = start + parseInt($scope.itemsPerPage, 10);
    $scope.paginatedOrders = $scope.filteredOrders.slice(start, end);
  };
  
  

  $scope.updateFilter = function () {
    $scope.currentPage = 1; // Reset về trang đầu
    $scope.updatePagination(); // Cập nhật danh sách
  };

  // Thay đổi khi itemsPerPage thay đổi
  $scope.changeItemsPerPage = function () {
    $scope.currentPage = 1; // Reset về trang đầu tiên
    $scope.updatePagination();
  };

  // Chuyển trang
  $scope.goToPage = function (page) {
    if (page >= 1 && page <= $scope.totalPages) {
      $scope.currentPage = page;
      $scope.updatePagination();
    }
  };

  $scope.$watchGroup(["Orders", "searchQuery"], function () {
    $scope.currentPage = 1;
    $scope.updatePagination();
  });

  $(document).on("hide.bs.modal", ".modal", function () {
    $scope.loadOrders();
    $scope.$apply();
  });

  $scope.getVisibleStatusButtons = function (originalStatus) {
    const visibleButtons = {
      1: [1, 2, 4], // Trạng thái Chờ Xác Nhận (hiển thị các nút 1, 2, 4)
      2: [2, 3, 4], // Trạng thái Chờ Giao Hàng (hiển thị các nút 2, 3, 4)
      3: [3], // Trạng thái Đã Giao Hàng (chỉ hiển thị nút 3)
      4: [4], // Trạng thái Đã Hủy (chỉ hiển thị nút 4)
    };
    return visibleButtons[originalStatus] || [];
  };

  $scope.isUpdateDisabled = function (originalStatus, selectedStatus) {
    // Nếu trạng thái ban đầu là "Đã Giao Hàng" hoặc "Đã Hủy", luôn vô hiệu hóa
    if (originalStatus === 3 || originalStatus === 4) {
      return true;
    }
    // Nếu trạng thái được chọn trùng với trạng thái ban đầu, vô hiệu hóa nút
    return originalStatus === selectedStatus;
  };

  $scope.getFilterCondition = function() {
    // Điều kiện lọc chung
    const filterCondition = {};
  
    // Lọc theo trạng thái đơn hàng
    if ($scope.selectedStatus) {
      filterCondition.statusName = $scope.selectedStatus;
    }
  
    // Lọc theo trạng thái thanh toán
    if ($scope.selectedPaymentStatus) {
      filterCondition.statuspay = { statuspayname: $scope.selectedPaymentStatus };
    }
  
    // Lọc theo hình thức bán (idrole)
    if ($scope.selectedIdRole) {
      filterCondition.account = { idrole: $scope.selectedIdRole };
    }
  
    return filterCondition;
  };

  $scope.getSaleMethod = function(idrole) {
    if (idrole === 1) {
        return "Bán Tại Quầy";
    } else if (idrole === 2) {
        return "Bán Online";
    } else {
        return "Không xác định"; // Phòng trường hợp giá trị khác không mong muốn
    }
};

  
  $scope.updatePaginatedOrders = function () {
    // Lọc các đơn hàng theo idrole nếu có, nếu không thì không lọc gì
    if ($scope.selectedIdRole === "") {
      $scope.paginatedOrders = angular.copy($scope.Orders); // Hiển thị tất cả các đơn hàng
    } else {
      $scope.paginatedOrders = $scope.Orders.filter(function(order) {
        return order.account.idrole == $scope.selectedIdRole;
      });
    }
  
    // Cập nhật lại phân trang
    $scope.updatePagination();
  };
  
  $scope.loadOrders();
});

app.controller("CheckLogin", function ($scope, $http, $window) {
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
    // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
    $window.location.href = "login.html"; // Đường dẫn đến trang đăng nhập
  }

  // Hàm cập nhật giao diện
  $scope.updateAccountMenu = function () {
    $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
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
              $window.location.href = "index.html"; // Hoặc sử dụng $timeout nếu cần delay
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
    $window.location.href = "login.html"; // Chuyển về trang đăng nhập sau khi đăng xuất
  };
});
