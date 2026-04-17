package com.trailbuddy.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public")
public class PublicController {

    @GetMapping("/test")
    public ResponseEntity<String> publicTest() {
        return ResponseEntity.ok("Public endpoint working!");
    }
}
