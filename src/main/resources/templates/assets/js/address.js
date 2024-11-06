var app = angular.module('myApp', []);

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

app.controller('AddressController', function($scope, $http) {
    // Khởi tạo thông tin địa chỉ
    $scope.userAddresses = [];
    $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    $scope.newAddress = { // Biến để lưu thông tin địa chỉ mới
        housenumber: '',
        roadname: '',
        district: '',
        city: '',
        ward: '' // Thêm ward vào biến
    };
    $scope.addSuccess = ""; // Biến để lưu thông báo thành công
    $scope.addError = ""; // Biến để lưu thông báo lỗi khi thêm địa chỉ

    // Phương thức lấy địa chỉ của người dùng đã đăng nhập
    $scope.loadUserAddresses = function() {
        if ($scope.loggedInUser) {
            // Gửi yêu cầu GET đến API chỉ với idaccount của người dùng đã đăng nhập
            $http.get(`http://localhost:8080/beesixcake/api/address/account/${$scope.loggedInUser.idaccount}`)
                .then(function(response) {
                    if (Array.isArray(response.data)) {
                        $scope.userAddresses = response.data; // Chỉ lưu địa chỉ của idaccount đã đăng nhập
                    } else {
                        $scope.userAddresses = []; // Nếu không có địa chỉ, set mảng rỗng
                    }
                })
                .catch(function(error) {
                    console.error("Lỗi khi tải danh sách địa chỉ:", error);
                });
        } else {
            $scope.userAddresses = []; // Nếu chưa đăng nhập, set mảng rỗng
        }
    };

    // Phương thức thêm địa chỉ mới
    $scope.addAddress = function() {
        if ($scope.loggedInUser) {
            // Gán idaccount của người dùng đã đăng nhập
            var newAddressData = {
                idaddress: 0, // Để API tự động tạo idaddress
                housenumber: $scope.newAddress.housenumber,
                roadname: $scope.newAddress.roadname,
                ward: $scope.newAddress.ward,
                district: $scope.newAddress.district,
                city: $scope.newAddress.city,
                account: {
                    idaccount: $scope.loggedInUser.idaccount, // Gán idaccount từ người dùng đã đăng nhập
                   
                }
            };
    
            console.log("Địa chỉ mới:", newAddressData); // Ghi log địa chỉ mới
    
            $http.post('http://localhost:8080/beesixcake/api/address', newAddressData)
                .then(function(response) {
                    $scope.addSuccess = "Thêm địa chỉ thành công!";
                    $scope.addError = ""; 
                    $scope.newAddress = { 
                        housenumber: '',
                        roadname: '',
                        district: '',
                        city: '',
                        ward: ''
                    };
                    $scope.loadUserAddresses(); // Tải lại danh sách địa chỉ của người dùng
                })
                .catch(function(error) {
                    // Ghi log lỗi chi tiết
                    if (error.data) {
                        console.error("Lỗi khi thêm địa chỉ:", error.data); // Ghi log dữ liệu lỗi
                        if (error.data.message) {
                            $scope.addError = error.data.message; // Hiển thị thông điệp lỗi từ server
                        } else {
                            $scope.addError = "Đã xảy ra lỗi không xác định."; // Thông báo lỗi chung
                        }
                    } else {
                        console.error("Lỗi không có dữ liệu:", error); // Ghi log nếu không có dữ liệu lỗi
                        $scope.addError = "Lỗi kết nối đến máy chủ."; // Thông báo lỗi kết nối
                    }
                    $scope.addSuccess = ""; // Reset thông báo thành công
                });
        } else {
            $scope.addError = "Vui lòng đăng nhập để thêm địa chỉ.";
        }
    };
    $scope.editAddress = function(address) {
        $scope.newAddress = angular.copy(address); // Sao chép thông tin địa chỉ đã chọn vào newAddress
    };
    $scope.updateAddress = function() {
        if ($scope.loggedInUser) {
            // Gán idaccount của người dùng đã đăng nhập
            var updatedAddressData = {
                idaddress: $scope.newAddress.idaddress, // Lấy idaddress từ địa chỉ đã chọn
                housenumber: $scope.newAddress.housenumber,
                roadname: $scope.newAddress.roadname,
                ward: $scope.newAddress.ward,
                district: $scope.newAddress.district,
                city: $scope.newAddress.city,
                account: {
                    idaccount: $scope.loggedInUser.idaccount // Gán idaccount từ người dùng đã đăng nhập
                }
            };
    
            console.log("Địa chỉ cập nhật:", updatedAddressData); // Ghi log địa chỉ cập nhật
    
            // Gửi yêu cầu PUT đến API để cập nhật địa chỉ
            $http.put('http://localhost:8080/beesixcake/api/address/', updatedAddressData)
                .then(function(response) {
                    $scope.addSuccess = "Cập nhật địa chỉ thành công!";
                    $scope.addError = ""; 
                    $scope.newAddress = { 
                        housenumber: '',
                        roadname: '',
                        district: '',
                        city: '',
                        ward: ''
                    };
                    $scope.loadUserAddresses(); // Tải lại danh sách địa chỉ của người dùng
                })
                .catch(function(error) {
                    // Ghi log lỗi chi tiết
                    if (error.data) {
                        console.error("Lỗi khi cập nhật địa chỉ:", error.data); // Ghi log dữ liệu lỗi
                        if (error.data.message) {
                            $scope.addError = error.data.message; // Hiển thị thông điệp lỗi từ server
                        } else {
                            $scope.addError = "Đã xảy ra lỗi không xác định."; // Thông báo lỗi chung
                        }
                    } else {
                        console.error("Lỗi không có dữ liệu:", error); // Ghi log nếu không có dữ liệu lỗi
                        $scope.addError = "Lỗi kết nối đến máy chủ."; // Thông báo lỗi kết nối
                    }
                    $scope.addSuccess = ""; // Reset thông báo thành công
                });
        } else {
            $scope.addError = "Vui lòng đăng nhập để cập nhật địa chỉ.";
        }
    };
    $scope.setDefaultAddress = function(address) {
        // Kiểm tra nếu địa chỉ này đã là mặc định rồi thì không làm gì cả
        if (address.isDefault) {
            return;
        }
    
        // Cập nhật địa chỉ mặc định cho người dùng
        // Gửi yêu cầu API để thay đổi trạng thái địa chỉ mặc định
        var defaultAddress = angular.copy(address);
        defaultAddress.isDefault = true;
    
        // Gửi yêu cầu API cập nhật địa chỉ mặc định
        AddressService.setDefaultAddress(defaultAddress).then(function(response) {
            // Cập nhật lại danh sách địa chỉ sau khi thay đổi
            $scope.userAddresses.forEach(function(addr) {
                addr.isDefault = (addr.idaddress === address.idaddress) ? true : false;
            });
        }, function(error) {
            console.error('Lỗi khi đặt địa chỉ mặc định:', error);
        });
    };
    
    
    // Gọi phương thức khi controller được khởi tạo
    $scope.loadUserAddresses();
    

});  