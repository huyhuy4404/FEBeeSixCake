app.controller("OrderController", [
  "$scope",
  "$http",
  function ($scope, $http) {
    $scope.statuses = []; // Danh sách trạng thái
    $scope.ordersByStatus = {}; // Phân loại đơn hàng theo trạng thái (dùng idstatus)
    $scope.selectedOrders = []; // Lưu đơn hàng được hiển thị
    $scope.loading = true;
    $scope.activeTab = 0; // Mặc định tab đầu tiên là active

    // Hàm để đặt tab đang được chọn
    $scope.setActiveTab = function (index) {
      $scope.activeTab = index;
    };

    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

    console.log("Thông tin đăng nhập (loggedInUser):", loggedInUser);

    console.log("ID Account đã lấy được:", loggedInUser.idaccount);

    function initialize() {
      $scope.loading = true;

      // Bước 1: Gọi API lấy danh sách trạng thái
      $http
        .get("http://localhost:8080/beesixcake/api/status")
        .then((statusResponse) => {
          console.log("Danh sách trạng thái:", statusResponse.data);
          $scope.statuses = statusResponse.data;

          // Chuẩn bị cấu trúc phân loại (theo idstatus)
          $scope.statuses.forEach((status) => {
            $scope.ordersByStatus[status.idstatus] = [];
          });

          console.log(
            "Keys of Orders By Status After Initialization:",
            Object.keys($scope.ordersByStatus)
          );

          // Bước 2: Gọi API lấy danh sách đơn hàng theo tài khoản
          return $http.get(
            `http://localhost:8080/beesixcake/api/order/account/${loggedInUser.idaccount}`
          );
        })
        .then((orderResponse) => {
          console.log("Danh sách đơn hàng:", orderResponse.data);
          const orders = orderResponse.data;

          // Bước 3: Gọi API lấy trạng thái chi tiết từng đơn hàng
          const promises = orders.map((order) =>
            $http
              .get(
                `http://localhost:8080/beesixcake/api/order-status-history/by-order/${order.idorder}`
              )
              .then((statusResponse) => {
                const statusData = statusResponse.data[0];
                order.statusname =
                  statusData?.status.statusname.trim() || "Không Xác Định";
                order.statusid = statusData?.status.idstatus || null; // Lưu id trạng thái
              })
              .catch((error) => {
                console.error(
                  `Lỗi khi lấy trạng thái đơn hàng ${order.idorder}:`,
                  error
                );
                order.statusname = "Không Xác Định";
                order.statusid = null; // Đặt id trạng thái là null nếu lỗi
              })
          );

          return Promise.all(promises).then(() => {
            // Phân loại đơn hàng theo id trạng thái
            orders.forEach((order) => {
              if (order.statusid && $scope.ordersByStatus[order.statusid]) {
                $scope.ordersByStatus[order.statusid].push(order);
              } else {
                console.warn(
                  `Không tìm thấy trạng thái tương ứng cho đơn hàng ${order.idorder}:`,
                  order.statusid
                );
              }
            });

            // Gán mặc định đơn hàng của trạng thái đầu tiên vào bảng
            const firstStatusId =
              $scope.statuses.length > 0 ? $scope.statuses[0].idstatus : null;
            if (firstStatusId) {
              $scope.selectedOrders = $scope.ordersByStatus[firstStatusId];
            }

            console.log(
              "Orders By Status After Classification:",
              $scope.ordersByStatus
            );
          });
        })
        .catch((error) => {
          console.error("Lỗi khi tải dữ liệu:", error);
        })
        .finally(() => {
          $scope.loading = false;
          console.log(
            "Trạng thái cuối cùng của Orders By Status:",
            $scope.ordersByStatus
          );
        });
    }

    initialize();

    // Hàm xử lý click vào trạng thái
    $scope.filterOrdersByStatus = function (statusId) {
      $scope.selectedOrders = $scope.ordersByStatus[statusId] || [];
      console.log(
        `Đơn hàng thuộc trạng thái ID "${statusId}":`,
        $scope.selectedOrders
      );
    };

    $scope.viewOrderDetails = function (order) {
      console.log(`Xem chi tiết đơn hàng: ${order.idorder}`);
    };

    $scope.cancelOrder = function (order) {
      console.log(`Hủy đơn hàng: ${order.idorder}`);
    };
  },
]);

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
