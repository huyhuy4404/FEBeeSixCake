var app = angular.module('myApp', []);

app.controller('SizeController', function($scope, $http, $timeout) {
    $scope.Sizes = [];  // Danh sách kích thước
    $scope.selectedSize = {};  // Kích thước đang chọn
    $scope.isEditMode = false;
    $scope.message = '';
    $scope.messageType = '';

    // Hàm hiển thị thông báo
    $scope.showMessage = function(message, type) {
        console.log('Message:', message);  // Kiểm tra giá trị message
        $scope.message = message;  // Nội dung thông báo
        $scope.messageType = type;  // Kiểu thông báo: 'success', 'error', 'info', etc.

        // Tự động ẩn thông báo sau 3 giây
        $timeout(function() {
            $scope.message = '';
            $scope.messageType = '';
        }, 3000);
    };

    // Hàm tiện ích để hiển thị thông báo thành công
    $scope.showSuccess = function(message) {
        $scope.showMessage(message, 'success');
    };

    // Hàm tiện ích để hiển thị thông báo lỗi
    $scope.showError = function(message) {
        $scope.showMessage(message, 'error');
    };

    // Hàm load danh sách kích thước từ API
    $scope.loadSizes = function(resetMessage = true) {
        $scope.selectedSize = {};  // Đặt lại form kích thước
        $scope.isEditMode = false; // Thoát khỏi chế độ chỉnh sửa (nếu đang chỉnh sửa)
        if (resetMessage) {
            $scope.message = '';     // Xóa thông báo trước đó (nếu có)
            $scope.messageType = '';
        }

        $http.get('http://localhost:8080/beesixcake/api/size')
            .then(function(response) {
                $scope.Sizes = response.data;  // Cập nhật danh sách kích thước
            })
            .catch(function(error) {
                $scope.showError('Có lỗi xảy ra khi làm mới danh sách.');
            });
    };

    // Hàm thêm kích thước
    $scope.addSize = function() {
        // Kiểm tra xem kích thước đã tồn tại trong danh sách chưa
        const sizeExists = $scope.Sizes.some(function(size) {
            return size.sizename === $scope.selectedSize.sizename;  // Sử dụng 'sizename'
        });

        if (sizeExists) {
            $scope.showError('Kích thước đã tồn tại!');
            $scope.selectedSize = {};  // Reset form nếu kích thước đã tồn tại
            return;  // Dừng lại nếu kích thước đã tồn tại
        }

        // Kiểm tra xem trường 'sizename' có trống không
        if (!$scope.selectedSize.sizename || !$scope.selectedSize.sizename.trim()) {
            $scope.showError('Vui lòng nhập kích thước.');
            return;
        }

        // Nếu không có trùng lặp, thực hiện thêm kích thước
        $http.post('http://localhost:8080/beesixcake/api/size', $scope.selectedSize)
            .then(function(response) {
                $scope.showSuccess('Thêm kích thước thành công!');
                $scope.Sizes.unshift(response.data);  // Thêm kích thước mới vào đầu danh sách
                $scope.selectedSize = {};  // Reset form sau khi thêm thành công
            })
            .catch(function(error) {
                if (error.data && error.data.message) {
                    $scope.showError('Có lỗi xảy ra khi thêm kích thước: ' + error.data.message);
                } else {
                    $scope.showError('Có lỗi xảy ra khi thêm kích thước.');
                }
            });
    };

    // Hàm chỉnh sửa kích thước
    $scope.editSize = function(size) {
        $scope.selectedSize = angular.copy(size);  // Sao chép dữ liệu kích thước vào form
        $scope.isEditMode = true;

        // Kích hoạt tab "Chỉnh sửa"
        var editTab = document.getElementById('edit-tab');
        var tab = new bootstrap.Tab(editTab); // Sử dụng Bootstrap Tab
        tab.show();  // Hiển thị tab "Chỉnh sửa"
    };

    // Hàm cập nhật kích thước
    $scope.updateSize = function() {
        // Kiểm tra xem trường 'sizename' có trống không
        if (!$scope.selectedSize.sizename || !$scope.selectedSize.sizename.trim()) {
            $scope.showError('Vui lòng nhập kích thước.');
            return;
        }

        $http.put('http://localhost:8080/beesixcake/api/size/' + $scope.selectedSize.idsize, $scope.selectedSize)
            .then(function(response) {
                $scope.showSuccess('Cập nhật kích thước thành công!');
                $scope.loadSizes(false);  // Không reset thông báo
                $scope.isEditMode = false;  // Tắt chế độ chỉnh sửa
                $scope.selectedSize = {};  // Reset form
            })
            .catch(function(error) {
                if (error.data && error.data.message) {
                    $scope.showError('Có lỗi xảy ra khi cập nhật kích thước: ' + error.data.message);
                } else {
                    $scope.showError('Có lỗi xảy ra khi cập nhật kích thước.');
                }
            });
    };

    // Hàm xóa kích thước
    $scope.deleteSize = function(idsize) {
        if (confirm('Bạn có chắc chắn muốn xóa kích thước này?')) {
            $http.delete('http://localhost:8080/beesixcake/api/size/' + idsize)
                .then(function(response) {
                    $scope.showSuccess('Xóa kích thước thành công!');
                    $scope.loadSizes();  // Tải lại danh sách và reset thông báo
                })
                .catch(function(error) {
                    if (error.status === 409) { // Kiểm tra mã trạng thái HTTP 409 Conflict
                        // Thông báo lỗi cụ thể khi kích thước đang được sử dụng
                        $scope.showError('Không thể xóa kích thước này vì nó đang được sử dụng bởi một hoặc nhiều sản phẩm.');
                    } else if (error.data && error.data.message) {
                        // Thông báo lỗi từ API nếu có
                        $scope.showError('Có lỗi xảy ra khi xóa kích thước: ' + error.data.message);
                    } else {
                        // Thông báo lỗi chung nếu không có thông tin chi tiết
                        $scope.showError('Có lỗi xảy ra khi xóa kích thước.');
                    }
                });
        }
    };
    
    // Tải danh sách kích thước khi khởi tạo
    $scope.loadSizes();
});
