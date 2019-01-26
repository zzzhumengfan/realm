/*
 *功能: 图片裁剪/压缩/上传
 * */


(function ($) {
    var imgUp = function (element, obj) {
        var _this = this;
        this.$element = $(element);
        // 初始参数
        var oDefaults = {
            maxLength: Number.POSITIVE_INFINITY, // 上传数量, 默认无限制
            imgCont: false, // 图片容器, 默认 父级 .z_imgCont
            imgSize: 10, // 图片最大限制, 默认最大10M
            imgBigSize: 50, // 隐藏大小, 当不设置图片上传大小时, 最大上传限制 50M;
            imgWh: false, // 裁剪图片比例, 默认不裁剪, true: 自由比例, '3:2' 裁剪宽高比例为 3:2
            imgCompress: false, // 图片压缩, 默认不压缩
            imgCompressWidth: false, // 图片压缩后宽, 默认不设置, 以图片原有宽
            imgCompressHeight: false, // 图片压缩后高, 默认不设置, 以图片原有高
            fileType: ["jpg", "png", "bmp", "jpeg"] // 上传文件的类型
        };
        // 参数设置
        this.argu = $.extend(true, {}, oDefaults, obj);
        this.argu.fileSize = this.argu.imgSize * 1024 * 1024;
        var $this = this.$element;
        // 图片容器
        if(!this.argu.imgCont){
           this.argu.imgCont = $this.parents('.z_imgcont');

        }else{
          this.argu.imgCont = $(''+this.argu.imgCont);
        }

        // 上传图片比例内容显示
        if (this.argu.imgWh && this.argu.imgWh != true) {
            // 如果传入裁剪比例, 设置裁剪模式
            var aImgWH = this.argu.imgWh.split(':');
            var sTagP = '<p class="z_file_bili">上传图片比例为' + aImgWH[0] + ':' + aImgWH[1] + '</p>';
            this.argu.cutAspect = aImgWH[0] / aImgWH[1]; // 裁剪模式固定比例
            $this.parent('.z_file').append(sTagP);
        } else {
            // 如果没有传入裁剪比例, 裁剪自由模式
            if (this.argu.imgWh == true) {
                this.argu.cutAspect = NaN;
            }
        }

        // 点击选择图片
        $this.change(function () {
            var file = $this[0];
            var fileList = file.files;
            var newFileList = _this.imgSelect(fileList);// 上传文件筛选
            var aImgSrc = null; // 可上传文件
            // 未选择文件
            if (newFileList.length == 0) {
                return;
            }

            // 选择文件错误信息显示
            if (newFileList[1].length > 0 || newFileList[2].length > 0 || newFileList[3].length > 0 || newFileList[4].length > 0) {
                var sTypeUndefined = '', sNoType = '', sNoSize = '', sNoSizeS = '', message = '';
                for (var i = 0; i < newFileList[1].length; i++) {
                    sTypeUndefined += " " + newFileList[1][i] + " ";
                }
                for (var i = 0; i < newFileList[2].length; i++) {
                    sNoType += " " + newFileList[2][i] + " ";
                }
                for (var i = 0; i < newFileList[3].length; i++) {
                    sNoSize += " " + newFileList[3][i] + " ";
                }
                for (var i = 0; i < newFileList[4].length; i++) {
                    sNoSizeS += " " + newFileList[4][i] + " ";
                }
                message += "您上传的文件: <br>";

                if (sTypeUndefined) {
                    message += sTypeUndefined + " 文件类型不能确定<br>";
                }
                if (sNoType) {
                    message += sNoType + " 文件类型不正确<br>";
                }
                if (sNoSize) {
                    message += sNoSize + " 文件过大,超出最大默认尺寸 " + _this.argu.imgBigSize + "M <br>";
                }
                if (sNoSizeS) {
                    message += sNoSizeS + " 文件过大,超出限制尺寸 " + _this.argu.imgSize + "M <br>";
                }
                message += "如果重新上传, 请点击 <em>确认</em> , 否则只上传符合条件的图片!";
                _this.layer(message, null, function () {
                    // 确认执行函数
                    $this.val("");
                    return null;
                }, function () {
                    // 取消执行函数
                    aImgSrc = newFileList[0];
                    if (aImgSrc.length <= 0) {
                        $this.val("");
                        return null;
                    }
                    // 开始上传图片
                    _this.upImgCheck(aImgSrc);
                });
            } else {
                aImgSrc = newFileList[0];
                // 开始上传图片
                _this.upImgCheck(aImgSrc);
            }

        });
    };

    // 方法
    imgUp.prototype = {

        // 上传图片筛选
        imgSelect: function (fileList) {
            var _this = this;
            var aOk = []; // 符合条件
            var aNew = []; // 不符合条件
            var aNoType = []; // 类型不符合条件
            var aNoSize = []; // 文件太大
            var aNoSizeS = []; // 文件超出上传限制
            var aTypeUndefined = []; // 类型不识别

            var numUp = _this.argu.imgCont.find('.z_up_section').length;
            var totalNum = numUp + fileList.length;
            // 判断文件数量
            if (fileList.length > _this.argu.maxLength || totalNum > _this.argu.maxLength) {
                _this.layer('上传图片的数量不能超过 ' + _this.argu.maxLength + '个, 请重新选择!');
                this.$element.val('');
                return [];
            }

            // 判断文件类型 大小
            for (var i = 0, file; file = fileList[i]; i++) {
                // 获取文件后缀名
                var aString = file.name.split("").reverse().join("");
                if (aString.split(".")[0] != null) {
                    var type = aString.split(".")[0].split("").reverse().join("");
                    // 文件类型判断
                    if (jQuery.inArray(type, _this.argu.fileType) > -1) {
                        // 文件大小判断
                        // 如果压缩
                        if (_this.argu.imgCompress) {
                            // 压缩
                            // 如果文件太大
                            if (file.size >= 1024 * 1024 * _this.argu.imgBigSize) {
                                aNoSize.push(file.name);
                            } else {
                                aOk.push(file);
                            }
                        } else {
                            // 不压缩
                            if (file.size >= _this.argu.fileSize) {
                                aNoSizeS.push(file.name);
                            } else {
                                aOk.push(file);
                            }
                        }

                    } else {
                        aNoType.push(file.name);
                    }
                } else {
                    aTypeUndefined.push(file.name);
                }
            }
            aNew.push(aOk, aTypeUndefined, aNoType, aNoSize, aNoSizeS);
            return aNew;
        },

        // 弹出层功能
        layer: function (message, obj, callbackOk, callbackNo) {
            var context = '<div class="mask mask-warning"><div class="mask-content"><p class="mask-message"></p><p class="mask-check"><span class="mask-yes">确认</span><span class="mask-no">取消</span></p></div></div>';
            var _this = this;

            if ($('.mask-warning').length == 0) {
                $('body').append(context);
            }
            $('.mask-warning').fadeIn();
            $('.mask-message').html(message);
            $(document).off('click', '.mask-warning').on('click', '.mask-warning', function () {
                $('.mask-warning').fadeOut();
                if (typeof callbackNo == 'function') {
                    callbackNo();
                }
            });
            // 点击content, 阻止事件
            $(document).off('click', '.mask-content').on('click', '.mask-content', function (e) {
                var e = e || window.event;
                e.stopPropagation();
            });

            // 点击确认
            $(document).off('click', '.mask-yes').on('click', '.mask-yes', function (e) {
                var e = e || window.event;
                e.stopPropagation();
                $('.mask-warning').fadeOut();
                if (typeof callbackOk == 'function') {
                    callbackOk.call(_this.$element, obj);
                }
            });

            // 点击取消
            $(document).off('click', '.mask-no').on('click', '.mask-no', function (e) {
                var e = e || window.event;
                e.stopPropagation();
                $('.mask-warning').fadeOut();
                if (typeof callbackNo == 'function') {
                    callbackNo();
                }
            })
        },

        // 上传图片判断
        upImgCheck: function (aImgSrc) {
            $(this).data('file', aImgSrc);
            this.imgTransfrom($(this).data('file')[0]);
        },

        // 上传图片转换
        imgTransfrom: function (file) {
            var _this = this;
            var fr = new FileReader();
            fr.readAsDataURL(file);
            fr.onload = function (e) {
                var imgSrc = this.result || e.target.result; // 图片地址
                var imgObj = new Image();
                var imgWidth, imgHeight;
                imgObj.src = imgSrc;

                // 是否裁剪
                if (_this.argu.imgWh) {
                    // 裁剪
                    imgObj.onload = function () {
                        imgWidth = imgObj.width;
                        imgHeight = imgObj.height;
                        // 图片大小
                        if (imgWidth / imgHeight == _this.argu.cutAspect) {
                            _this.addEle(imgSrc);
                            $(_this).data('file').shift();
                            if ($(_this).data('file').length == 0) {
                                return null;
                            } else {
                                // 递归调用, 多图同时上传
                                _this.imgTransfrom($(_this).data('file')[0]);
                            }
                        } else {
                            _this.layer('您上传的图片'+file.name+'不符合尺寸要求, 需要进行裁剪!', null, function () {
                                _this.cutImg(imgSrc);

                            }, function () {
                                $(_this).data('file').shift();
                                if ($(_this).data('file').length == 0) {
                                    return null;
                                } else {
                                    // 递归调用, 多图同时上传
                                    _this.imgTransfrom($(_this).data('file')[0]);
                                }
                            });

                        }
                    };

                } else {
                    // 不裁剪
                    if (_this.baseImgSize(imgSrc) > _this.argu.fileSize) {
                        // 转换base64位后, 大小会增加1/3, 超出范围进行压缩
                        imgObj.onload = function () {
                            imgWidth = imgObj.width;
                            imgHeight = imgObj.height;
                            // 图片大小
                            var sImgSrc = _this.compressImg(imgObj, imgWidth, imgHeight);
                            if (sImgSrc === 'undefined') {
                                return null;
                            }
                            _this.addEle(sImgSrc);
                            $(_this).data('file').shift();
                            if ($(_this).data('file').length == 0) {
                                return null;
                            } else {
                                // 递归调用, 多图同时上传
                                _this.imgTransfrom($(_this).data('file')[0]);
                            }

                        }
                    } else {
                        // 转换base64后未超出限制大小范围
                        _this.addEle(imgSrc);
                        $(_this).data('file').shift();
                        if ($(_this).data('file').length == 0) {
                            return null;
                        } else {
                            // 递归调用, 多图同时上传
                            _this.imgTransfrom($(_this).data('file')[0]);
                        }
                    }
                }
            }
        },

        //添加图片功能
        addEle: function (imgSrc) {
            var _this = this;
            var sHtml = '<section class="z_up_section z_loading"><span class="z_up_span"></span><div class="z_close_upimg"></div><img class="z_up_img z_up_opcity" src="' + imgSrc + '" alt=""><input type="hidden"  name="z_img" value=""></section>';

            _this.argu.imgCont.prepend(sHtml);

            var $sHtml = _this.argu.imgCont.find('.z_up_section').eq(0);
            // 删除节点
            $sHtml.on('click', '.z_close_upimg', function (event) {
                var event = event || window.event;
                event.preventDefault();
                event.stopPropagation();
                var delPart = $(this).parent();
                _this.layer('您确定要删除此图片吗?', delPart, function (delPart) {
                    delPart.remove();
                    this.parent().show();
                });
            });

            // 去除loading效果
            setTimeout(function () {
                $(".z_loading").removeClass("z_loading");
                $('.z_up_opcity').removeClass("z_up_opcity");
            }, 450);

            // 添加图片显示与隐藏
            var numUp = _this.argu.imgCont.find(".z_up_section").length;
            if (numUp >= this.argu.maxLength) {
                this.$element.parent().hide();
            }
            // 请除input内上传图片
            this.$element.val('');

        },
        // 图片裁剪功能
        cutImg: function (sImgSrc) {
            var _this = this;
            var sHtml = '<div class="z_cutlayer_mask"><aside class="z_cutlayer"><div class="z_cutlayer_container"><img src="" alt="" id="z_cutlayer_img"></div><div class="z_cutlayer_right"><div class="z_cutlayer_button"><span class="z_cutlayer_big"></span><span class="z_cutlayer_small"></span><span class="z_cutlayer_roright"></span><span class="z_cutlayer_roleft"></span><span class="z_cutlayer_upload"></span><span class="z_cutlayer_close"></span></div></div></aside></div>';
            if ($('.z_cutlayer_mask').length == 0) {
                $('body').append(sHtml);
            }
            $('.z_cutlayer_mask').fadeIn();
            var $image = $('#z_cutlayer_img'); // 图片容器
            var bool = true; // 连续点击禁止
            $image.attr('src', sImgSrc);
            $image.cropper('destroy').cropper({
                aspectRatio: _this.argu.cutAspect,
                viewMode: 2,
                background: false
            });

            // 裁剪功能区
            // 放大
            $('.z_cutlayer_big').on('click', function () {
                $image.cropper('zoom', 0.1);
            });
            // 缩小
            $('.z_cutlayer_small').on('click', function () {
                $image.cropper('zoom', -0.1);
            });

            // 左旋
            $('.z_cutlayer_roright').on('click', function () {
                $image.cropper('rotate', 90);
            });
            // 右旋
            $('.z_cutlayer_roleft').on('click', function () {
                $image.cropper('rotate', -90);
            });
            //上移
            $('.z_cutlayer_mvtop').on('click', function () {
                $image.cropper('move', 0, -10);
            });
            // 下移
            $('.z_cutlayer_mvbottom').on('click', function () {
                $image.cropper('move', 0, 10);
            });
            // 左移
            $('.z_cutlayer_mvleft').on('click', function () {
                $image.cropper('move', -10, 0);
            });
            // 右移
            $('.z_cutlayer_mvright').on('click', function () {
                $image.cropper('move', 10, 0);
            });

            // 键盘操作
            $(document.body).on('keydown', function (e) {

                if (!$image.data('cropper') || this.scrollTop > 300) {
                    return;
                }

                switch (e.which) {
                    case 37:
                        e.preventDefault();
                        $image.cropper('move', -1, 0);
                        break;

                    case 38:
                        e.preventDefault();
                        $image.cropper('move', 0, -1);
                        break;

                    case 39:
                        e.preventDefault();
                        $image.cropper('move', 1, 0);
                        break;

                    case 40:
                        e.preventDefault();
                        $image.cropper('move', 0, 1);
                        break;
                }

            });

            // 关闭
            $('.z_cutlayer_close').on('click', function () {
                $image.cropper('destroy');
                $('.z_cutlayer_mask').fadeOut();
            });

            // 上传
            $('.z_cutlayer_upload').off('click').on('click', function () {
                if (bool) {
                    bool = false;
                    $('.z_cutlayer_mask').fadeOut();
                    var x = 1.0;
                    var sNewImgSrc = $image.cropper('getCroppedCanvas').toDataURL('base64', x);

                    if (_this.baseImgSize(sNewImgSrc) > _this.argu.fileSize) {
                        do {
                            x -= 0.1;
                            if (x <= 0) {
                                _this.layer('您上传的图片已经超出压缩范围, 请使用专业工具压缩后再上传!',null,function () {
                                    $(_this).data('file').shift();
                                    if ($(_this).data('file').length == 0) {
                                        return null;
                                    } else {
                                        // 递归调用, 多图同时上传
                                        _this.imgTransfrom($(_this).data('file')[0]);
                                    }
                                });
                                return;
                            }
                            sNewImgSrc = $image.cropper('getCroppedCanvas').toDataURL('base64', x);
                        } while (_this.baseImgSize(sNewImgSrc) > _this.argu.fileSize)
                    }

                    _this.addEle(sNewImgSrc);

                    $(_this).data('file').shift();
                    if ($(_this).data('file').length == 0) {
                        return null;
                    } else {
                        // 递归调用, 多图同时上传
                        _this.imgTransfrom($(_this).data('file')[0]);
                    }
                }

            });
            return null;
        },
        // 图片压缩功能
        compressImg: function (oImgObj, imgWidth, imgHeight) {
            var scale = imgWidth / imgHeight; // 上传图片比例
            var x = 1, size, cropStr;
            var cWidth = this.argu.imgCompressWidth || parseInt(scale * this.argu.imgCompressHeight) || imgWidth;
            var cHeight = this.argu.imgCompressHeight || parseInt(this.argu.imgCompressWidth / scale) || imgHeight;
            var $canvas = $('<canvas width="' + cWidth + '" height="' + cHeight + '"></canvas>');
            var ctx = $canvas[0].getContext('2d');
            ctx.drawImage(oImgObj, 0, 0, imgWidth, imgHeight, 0, 0, cWidth, cHeight);
            do {
                cropStr = $canvas[0].toDataURL("image/jpeg", x);
                size = this.baseImgSize(cropStr);
                x -= 0.1;
                if (x <= 0) {
                    this.layer('您上传的图片已经超出压缩范围, 请使用专业工具压缩后再上传!',null,function () {
                        $(_this).data('file').shift();
                        if ($(_this).data('file').length == 0) {
                            return null;
                        } else {
                            // 递归调用, 多图同时上传
                            _this.imgTransfrom($(_this).data('file')[0]);
                        }
                    });
                    this.$element.val("");
                    return;
                }

            } while (size > this.argu.fileSize);
            return cropStr;
        },
        // 计算base64位图片的大小
        baseImgSize: function (imgSrc) {
            var equalIndex = imgSrc.indexOf('=');
            str = imgSrc.substring(23);
            if (equalIndex > 0) {
                str = imgSrc.substring(0, equalIndex);
            }
            // 图片大小 字节
            return str.length;
        }
    };

    $.fn.imgUp = function (option) {
        var args = arguments;
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('imgUp');
            if (typeof option === 'object' || typeof option === 'undefined') {
                var options = typeof option == 'object' && option;
                var data_api_options = $this.data();
                options = $.extend(options, data_api_options);
                $this.data('imgUp', (data = new imgUp(this, options)));
            } else if (data && typeof option === 'string') {
                data[option].apply(data, Array.prototype.slice.call(args, 1));
            }
        });
    }
})(jQuery);
