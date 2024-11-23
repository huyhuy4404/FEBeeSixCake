// app.js
var app = angular.module('myApp', []);

// Controller để kiểm tra đăng nhập
app.controller("CheckLogin", function ($scope, $http, $window) {
  // Khởi tạo thông tin người dùng và trạng thái đăng nhập
  $scope.isLoggedIn = false;
  $scope.user = {
    idaccount: "",
    password: "",
  };
  $scope.loginError = ""; // Biến để lưu thông báo lỗi
  $scope.loginSuccess = ""; // Biến để lưu thông báo thành công

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
      $scope.loginSuccess = ""; // Reset thông báo thành công

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


// Controller để quản lý địa chỉ
app.controller('AddressController', function ($scope, $http, $window, $q) {
  // Khởi tạo biến cần thiết
  $scope.userAddresses = [];
  $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  $scope.newAddress = {
    housenumber: '',
    roadname: '',
    tinh: null,
    quan: null,
    city: null,
    ward: null
  };
  $scope.addSuccess = "";
  $scope.addError = "";
  $scope.isEditing = false;

  // Khởi tạo danh sách tỉnh, quận, phường
  $scope.tinhs = [];
  $scope.quans = [];
  $scope.phuongs = [];

  // Biến để lưu city của tài khoản idrole=1
  $scope.adminCities = [];

  // Hàm kiểm tra xem người dùng có phải là admin không
  $scope.isAdmin = function () {
    return $scope.loggedInUser.idrole === 1;
  };

  // Hàm tải danh sách tài khoản từ API
  $scope.loadAccounts = function () {
    return $http.get("http://localhost:8080/beesixcake/api/account")
      .then(function (response) {
        $scope.accounts = response.data;
        // Lọc các tài khoản có idrole=1 và active=true
        const adminAccounts = $scope.accounts.filter(account => account.idrole === 1 && account.active);
        if (adminAccounts.length > 0) {
          // Tải địa chỉ của các tài khoản admin
          const adminPromises = adminAccounts.map(admin =>
            $http.get(`http://localhost:8080/beesixcake/api/address/account/${admin.idaccount}`)
          );
          return $q.all(adminPromises);
        } else {
          console.error("Không tìm thấy tài khoản admin với idrole=1");
          return [];
        }
      })
      .then(function (responses) {
        responses.forEach(response => {
          const adminAddresses = Array.isArray(response.data) ? response.data : [];
          const defaultAddress = adminAddresses.find(addr => addr.isDefault);
          if (defaultAddress && defaultAddress.city && defaultAddress.city !== "null") {
            $scope.adminCities.push(defaultAddress.city);
          }
        });
        // Nếu có nhiều city từ các admin, bạn có thể chọn cách xử lý phù hợp, ví dụ lấy city đầu tiên
        $scope.adminCity = $scope.adminCities.length > 0 ? $scope.adminCities[0] : '';
        console.log("adminCity được thiết lập là:", $scope.adminCity);
      })
      .catch(function (error) {
        console.error("Lỗi khi tải tài khoản admin:", error);
      });
  };

  // Hàm tải danh sách tỉnh thành từ API, dựa trên idrole của người dùng
  $scope.loadTinhs = function () {
    if ($scope.isAdmin()) {
      // Nếu là admin, tải toàn bộ danh sách tỉnh thành
      $http.get('https://esgoo.net/api-tinhthanh/1/0.htm')
        .then(function (response) {
          if (response.data.error === 0) {
            $scope.tinhs = response.data.data;
            console.log("Tỉnh thành được tải cho admin:", $scope.tinhs);

            // Thiết lập newAddress.tinh thành adminCity
            if ($scope.tinhs.length > 0 && !$scope.newAddress.tinh) {
              const adminTinh = $scope.tinhs.find(tinh => tinh.full_name === $scope.adminCity);
              if (adminTinh) {
                $scope.newAddress.tinh = adminTinh;
              } else {
                // Nếu không tìm thấy adminCity trong danh sách tỉnh, chọn tỉnh đầu tiên
                $scope.newAddress.tinh = $scope.tinhs[0];
              }
            }
          } else {
            console.error("Lỗi từ API khi tải tỉnh thành:", response.data.message);
          }
        })
        .catch(function (error) {
          console.error("Lỗi khi tải tỉnh thành:", error);
        });
    } else {
      // Nếu không phải admin, tải danh sách tỉnh thành dựa trên adminCity
      if ($scope.adminCity) {
        // Giả sử API không hỗ trợ lọc trực tiếp, ta sẽ tải tất cả và lọc tại client
        $http.get('https://esgoo.net/api-tinhthanh/1/0.htm')
          .then(function (response) {
            if (response.data.error === 0) {
              // Lọc tỉnh thành dựa trên adminCity
              $scope.tinhs = response.data.data.filter(tinh => tinh.full_name === $scope.adminCity);
              console.log("Tỉnh thành được tải dựa trên adminCity:", $scope.tinhs);

              // Thiết lập newAddress.tinh nếu có dữ liệu
              if ($scope.tinhs.length > 0 && !$scope.newAddress.tinh) {
                $scope.newAddress.tinh = $scope.tinhs[0];
              }
            } else {
              console.error("Lỗi từ API khi tải tỉnh thành:", response.data.message);
            }
          })
          .catch(function (error) {
            console.error("Lỗi khi tải tỉnh thành dựa trên adminCity:", error);
          });
      } else {
        console.error("adminCity không được xác định.");
      }
    }
  };

// Hàm tải quận/huyện và trả về Promise
$scope.loadQuans = function () {
  if (!$scope.newAddress.tinh) {
      $scope.quans = [];
      $scope.phuongs = [];
      $scope.newAddress.quan = null;
      $scope.newAddress.ward = null;
      return $q.resolve(); // Trả về một Promise đã được giải quyết
  }

  var idtinh = $scope.newAddress.tinh.id;

  // Hiển thị trạng thái tải quận/huyện (nếu cần)
  $scope.isLoadingQuans = true;

  // Trả về Promise từ $http.get
  return $http.get('https://esgoo.net/api-tinhthanh/2/' + idtinh + '.htm')
      .then(function (response) {
          if (response.data.error === 0) {
              $scope.quans = response.data.data;
              $scope.phuongs = [];
              $scope.newAddress.quan = null;
              $scope.newAddress.ward = null;
              console.log("Quận/Huyện được tải:", $scope.quans);
          } else {
              console.error("Lỗi từ API khi tải quận/huyện:", response.data.message);
              $scope.quans = [];
              $scope.phuongs = [];
              $scope.newAddress.quan = null;
              $scope.newAddress.ward = null;
          }
      })
      .catch(function (error) {
          console.error("Lỗi khi tải quận/huyện:", error);
          $scope.quans = [];
          $scope.phuongs = [];
          $scope.newAddress.quan = null;
          $scope.newAddress.ward = null;
      })
      .finally(function () {
          $scope.isLoadingQuans = false;
      });
};
// Hàm tải phường/xã và trả về Promise
// Hàm tải phường/xã và trả về Promise
$scope.loadPhuongs = function () {
  if (!$scope.newAddress.quan) {
      $scope.phuongs = [];
      $scope.newAddress.ward = null;
      return $q.resolve(); // Trả về một Promise đã được giải quyết
  }

  var idquan = $scope.newAddress.quan.id;

  // Hiển thị trạng thái tải phường/xã (nếu cần)
  $scope.isLoadingPhuongs = true;

  // Trả về Promise từ $http.get
  return $http.get('https://esgoo.net/api-tinhthanh/3/' + idquan + '.htm')
      .then(function (response) {
          if (response.data.error === 0) {
              $scope.phuongs = response.data.data;
              $scope.newAddress.ward = null;
              console.log("Phường/Xã được tải:", $scope.phuongs);
          } else {
              console.error("Lỗi từ API khi tải phường/xã:", response.data.message);
              $scope.phuongs = [];
              $scope.newAddress.ward = null;
          }
      })
      .catch(function (error) {
          console.error("Lỗi khi tải phường/xã:", error);
          $scope.phuongs = [];
          $scope.newAddress.ward = null;
      })
      .finally(function () {
          $scope.isLoadingPhuongs = false;
      });
};


  $scope.quanMap = {};
  $scope.phuongMap = {};

// Phương thức tải địa chỉ của người dùng đã đăng nhập
$scope.loadUserAddresses = function () {
  if ($scope.loggedInUser) {
      return $http.get(`http://localhost:8080/beesixcake/api/address/account/${$scope.loggedInUser.idaccount}`)
          .then(function (response) {
              $scope.userAddresses = Array.isArray(response.data) ? response.data : [];

              // Tạo các promise để tải quận/huyện và phường/xã cho từng địa chỉ
              var addressPromises = $scope.userAddresses.map(function (address) {
                  var tinhId = address.tinh; // Giả sử `address.tinh` là ID của tỉnh
                  var quanId = address.quan; // Giả sử `address.quan` là ID của quận/huyện
                  var wardId = address.ward; // Giả sử `address.ward` là ID của phường/xã

                  // Hàm để tải quận/huyện nếu chưa có trong cache
                  var loadQuan = function () {
                      if ($scope.quanMap[quanId]) {
                          address.quanObj = $scope.quanMap[quanId];
                          return $q.resolve();
                      } else {
                          return $http.get('https://esgoo.net/api-tinhthanh/2/' + tinhId + '.htm')
                              .then(function (response) {
                                  if (response.data.error === 0) {
                                      var quans = response.data.data;
                                      var quan = quans.find(q => q.id === quanId);
                                      if (quan) {
                                          $scope.quanMap[quanId] = quan;
                                          address.quanObj = quan;
                                      } else {
                                          address.quanObj = { full_name: 'Không xác định' };
                                      }
                                  } else {
                                      console.error("Lỗi từ API khi tải quận/huyện:", response.data.message);
                                      address.quanObj = { full_name: 'Không xác định' };
                                  }
                              })
                              .catch(function (error) {
                                  console.error("Lỗi khi tải quận/huyện:", error);
                                  address.quanObj = { full_name: 'Không xác định' };
                              });
                      }
                  };

                  // Hàm để tải phường/xã nếu chưa có trong cache
                  var loadPhuong = function () {
                      if ($scope.phuongMap[wardId]) {
                          address.wardObj = $scope.phuongMap[wardId];
                          return $q.resolve();
                      } else {
                          return $http.get('https://esgoo.net/api-tinhthanh/3/' + quanId + '.htm')
                              .then(function (response) {
                                  if (response.data.error === 0) {
                                      var phuongs = response.data.data;
                                      var phuong = phuongs.find(w => w.id === wardId);
                                      if (phuong) {
                                          $scope.phuongMap[wardId] = phuong;
                                          address.wardObj = phuong;
                                      } else {
                                          address.wardObj = { full_name: 'Không xác định' };
                                      }
                                  } else {
                                      console.error("Lỗi từ API khi tải phường/xã:", response.data.message);
                                      address.wardObj = { full_name: 'Không xác định' };
                                  }
                              })
                              .catch(function (error) {
                                  console.error("Lỗi khi tải phường/xã:", error);
                                  address.wardObj = { full_name: 'Không xác định' };
                              });
                      }
                  };

                  // Trả về một promise để tải quận/huyện và phường/xã
                  return loadQuan().then(loadPhuong);
              });

              // Thực hiện tất cả các promise
              return $q.all(addressPromises);
          })
          .then(function () {
              // Sau khi tất cả địa chỉ đã được xử lý
              $scope.userAddresses.forEach(address => {
                  if (address.account.idrole === 2) {
                      address.displayCity = $scope.adminCity || address.city;
                  } else {
                      address.displayCity = address.city;
                  }
              });
              console.log("Địa chỉ người dùng được tải:", $scope.userAddresses);
          })
          .catch(function (error) {
              console.error("Lỗi khi tải danh sách địa chỉ:", error);
          });
  } else {
      $scope.userAddresses = [];
      return $q.resolve(); // Trả về một Promise đã được giải quyết
  }
};



 // Hàm gọi cả loadAccounts và loadTinhs và loadUserAddresses
$scope.initialize = function () {
  $scope.loadAccounts().then(function () {
      return $scope.loadTinhs();
  }).then(function () {
      return $scope.loadUserAddresses();
  });
};

// Gọi hàm initialize khi controller khởi tạo
$scope.initialize();



  // Watcher để lắng nghe sự thay đổi của adminCity
  $scope.$watch('adminCity', function (newVal, oldVal) {
    if (newVal !== oldVal) {
      $scope.userAddresses.forEach(address => {
        if (address.account.idrole === 2) {
          address.displayCity = newVal || address.city;
        }
      });
      // Nếu người dùng không phải admin, có thể cần tải lại tỉnh thành
      if ($scope.loggedInUser.idrole !== 1) {
        $scope.loadTinhs();
      }
      console.log("adminCity đã thay đổi thành:", $scope.adminCity);
    }
  });


  $scope.editAddress = function (address) {
    $scope.isEditing = true;
    // Sao chép địa chỉ cần chỉnh sửa
    $scope.newAddress = angular.copy(address);
    console.log("Editing address:", $scope.newAddress);

    // Tìm đối tượng 'tinh' dựa trên 'address.displayCity' hoặc 'address.city'
    if (address.displayCity) {
        const selectedTinh = $scope.tinhs.find(tinh => tinh.full_name === address.displayCity);
        console.log("Selected Tinh:", selectedTinh);
        if (selectedTinh) {
            $scope.newAddress.tinh = selectedTinh;
        } else {
            $scope.newAddress.tinh = null;
        }
    }

    // Tải danh sách quận/huyện và phường/xã
    if ($scope.newAddress.tinh) {
        $scope.loadQuans().then(function () {
            if (address.district) {
                // Tìm quan dựa trên tên
                const selectedQuan = $scope.quans.find(quan => quan.full_name === address.district);
                console.log("Selected Quan:", selectedQuan);
                if (selectedQuan) {
                    $scope.newAddress.quan = selectedQuan;
                } else {
                    $scope.newAddress.quan = null;
                }
            }
            return $scope.loadPhuongs();
        }).then(function () {
            if (address.ward) {
                // Tìm phuong dựa trên tên
                const selectedWard = $scope.phuongs.find(ward => ward.full_name === address.ward);
                console.log("Selected Ward:", selectedWard);
                if (selectedWard) {
                    $scope.newAddress.ward = selectedWard;
                } else {
                    $scope.newAddress.ward = null;
                }
            }
        }).finally(function () {
            // Hiển thị modal chỉnh sửa sau khi dữ liệu đã được tải xong
            var addressModal = new bootstrap.Modal(document.getElementById('addressModal'), {});
            addressModal.show();
        });
    } else {
        // Nếu không có tỉnh, chỉ hiển thị modal
        var addressModal = new bootstrap.Modal(document.getElementById('addressModal'), {});
        addressModal.show();
    }
};



  $scope.userAddresses = [];
  $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  $scope.newAddress = {
      housenumber: '',
      roadname: '',
      tinh: null,
      quan: null,
      city: null, // Để null, sẽ được cập nhật dựa trên 'tinh'
      ward: null
  };
  $scope.addSuccess = "";
  $scope.addError = "";
  $scope.isEditing = false;

  // Các biến khác...
  $scope.tinhs = [];
  $scope.quans = [];
  $scope.phuongs = [];
  $scope.adminCities = [];

  // Hàm kiểm tra xem người dùng có phải là admin không
  $scope.isAdmin = function () {
      return $scope.loggedInUser.idrole === 1;
  };


// Watcher để theo dõi sự thay đổi của newAddress.tinh
$scope.$watch('newAddress.tinh', function(newVal, oldVal) {
  if(newVal){
      // Cập nhật city dựa trên tinh
      $scope.newAddress.city = newVal.full_name;
      // Tải quận/huyện dựa trên tinh đã được thiết lập
      $scope.loadQuans().then(function(){
          // Nếu đang chỉnh sửa và quận đã được thiết lập, tải phường/xã
          if($scope.isEditing && $scope.newAddress.quan){
              $scope.loadPhuongs();
          }
      });
  } else {
      $scope.newAddress.city = null;
  }
});



  $scope.saveAddress = function () {
    // Kiểm tra dữ liệu nhập
    if (!$scope.newAddress.housenumber || !$scope.newAddress.roadname ||
        !$scope.newAddress.tinh || !$scope.newAddress.quan || !$scope.newAddress.ward) {
        $scope.addError = "Vui lòng điền đầy đủ thông tin địa chỉ!";
        $scope.addSuccess = "";
        return;
    }

    const addressData = {
        idaddress: $scope.isEditing ? $scope.newAddress.idaddress : 0,
        housenumber: $scope.newAddress.housenumber,
        roadname: $scope.newAddress.roadname,
        ward: $scope.newAddress.ward.full_name, // Sử dụng tên đầy đủ
        district: $scope.newAddress.quan.full_name, // Sử dụng tên đầy đủ
        city: $scope.newAddress.city, // Đã được cập nhật từ tinh
        account: { idaccount: $scope.loggedInUser.idaccount }
    };

    console.log("Dữ liệu gửi đi:", addressData);

    const request = $scope.isEditing
        ? $http.put(`http://localhost:8080/beesixcake/api/address/${$scope.newAddress.idaddress}`, addressData)
        : $http.post('http://localhost:8080/beesixcake/api/address', addressData);

    request
        .then(function (response) {
            $scope.addSuccess = $scope.isEditing ? "Cập nhật địa chỉ thành công!" : "Thêm địa chỉ thành công!";
            $scope.addError = "";
            $scope.isEditing = false;
            $scope.resetForm();

            // Cập nhật danh sách địa chỉ
            if ($scope.isAdmin()) {
                $scope.loadAccounts().then(function () {
                    $scope.loadTinhs();
                    $scope.loadUserAddresses();
                });
            } else {
                $scope.loadUserAddresses();
            }

            // Đóng modal
            var addressModal = bootstrap.Modal.getInstance(document.getElementById('addressModal'));
            addressModal.hide();
        })
        .catch(function (error) {
            console.error("Lỗi API:", error);
            $scope.addError = error.data?.message || "Đã xảy ra lỗi không xác định.";
            $scope.addSuccess = "";
        });
};




// Phương thức resetForm
$scope.resetForm = function () {
  $scope.newAddress = { 
      housenumber: '', 
      roadname: '', 
      tinh: null, 
      quan: null, 
      city: null, // Đặt lại thành null
      ward: null 
  };
  $scope.quans = []; // Đặt lại danh sách quận/huyện
  $scope.phuongs = []; // Đặt lại danh sách phường/xã
  $scope.isEditing = false;
  $scope.addSuccess = "";
  $scope.addError = "";
};


  // Gọi hàm initialize khi controller khởi tạo
  $scope.initialize();
  
  // Đặt lại form về trạng thái ban đầu
  // $scope.resetForm = function () {
  //   $scope.newAddress = { housenumber: '', roadname: '', tinh: null, quan: null, city: 'Cần Thơ', ward: null };
  //   $scope.quans = []; // Đặt lại danh sách quận/huyện
  //   $scope.phuongs = []; // Đặt lại danh sách phường/xã
  //   $scope.isEditing = false;
  //   $scope.addSuccess = "";
  //   $scope.addError = "";
  // };

  // Đặt địa chỉ mặc định
  $scope.setAsDefault = function (address) {
    if (address.isDefault) return;

    // Đặt tất cả địa chỉ khác không phải mặc định
    $scope.userAddresses.forEach(addr => addr.isDefault = false);
    address.isDefault = true;

    const addressData = {
      ...address,
      account: { idaccount: $scope.loggedInUser.idaccount },
      isDefault: true
    };

    $http.put(`http://localhost:8080/beesixcake/api/address/${address.idaddress}`, addressData)
      .then(function () {
        $scope.loadUserAddresses();
        $scope.addSuccess = "Địa chỉ mặc định đã được thay đổi!";
      })
      .catch(function (error) {
        $scope.addError = error.data?.message || "Đã xảy ra lỗi không xác định.";
      });
  };


  $scope.openDeleteModal = function (address) {
    if (address.isDefault) {
        // Nếu địa chỉ là mặc định, hiển thị thông báo lỗi
        $scope.addError = "Địa chỉ mặc định không thể xóa!";
        // Tạo một Bootstrap toast để hiển thị thông báo
        showToast("Lỗi", $scope.addError);
        return; // Dừng quá trình xóa
    }

    // Nếu không phải địa chỉ mặc định, tiếp tục mở modal xác nhận xóa
    $scope.addressToDelete = address;
    var modal = new bootstrap.Modal(document.getElementById("deleteConfirmationModal"));
    modal.show();
};
// Hàm để hiển thị Bootstrap toast
function showToast(title, message) {
  // Tạo nội dung cho toast
  var toastHtml = `
      <div class="toast align-items-center text-bg-danger border-0" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="d-flex">
              <div class="toast-body">
                  <strong>${title}:</strong> ${message}
              </div>
              <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
      </div>
  `;

  // Thêm toast vào body
  var toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
      // Nếu chưa có container, tạo mới
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.style.position = 'fixed';
      toastContainer.style.top = '20px';
      toastContainer.style.right = '20px';
      toastContainer.style.zIndex = '9999';
      document.body.appendChild(toastContainer);
  }

  // Thêm toast vào container
  toastContainer.innerHTML += toastHtml;

  // Lấy phần tử toast mới thêm
  var newToast = toastContainer.lastElementChild;
  var toast = new bootstrap.Toast(newToast, { delay: 3000 });
  toast.show();

  // Xóa toast sau khi 3 giây
  newToast.addEventListener('hidden.bs.toast', function () {
      newToast.remove();
  });
}


  $scope.closeDeleteModal = function () {
    $scope.addressToDelete = null;
    var modal = bootstrap.Modal.getInstance(document.getElementById("deleteConfirmationModal"));
    modal.hide();
  };

  $scope.confirmDelete = function () {
    if ($scope.addressToDelete) {
      $http.delete(`http://localhost:8080/beesixcake/api/address/${$scope.addressToDelete.idaddress}`)
        .then(function () {
          $scope.loadUserAddresses();
          $scope.closeDeleteModal();
          $scope.resetForm(); // Reset form sau khi xóa
        })
        .catch(function (error) {
          console.error("Lỗi khi xóa địa chỉ:", error);
        });
    }
  };
});

