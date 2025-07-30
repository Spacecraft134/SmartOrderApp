import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export const LaunchPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const navigate = useNavigate();

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Features data (added two more features)
  const features = [
    {
      title: "Real-Time Order Management",
      description: "Track orders from kitchen to table with live updates",
      icon: "📊",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Customer Self-Ordering",
      description: "QR codes for seamless customer ordering experience",
      icon: "📱",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Advanced Analytics",
      description:
        "Data-driven insights to optimize your restaurant operations",
      icon: "📈",
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] to-[#0a1129] text-white overflow-hidden relative">
      {/* Enhanced background effects */}
      <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
        {/* Grid lines */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMEg0MFY0MEgweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-20" />
      </div>

      {/* Navigation Bar */}
      <motion.nav
        className={`fixed w-full z-50 transition-all duration-300 py-4 ${
          isScrolled
            ? "bg-[#0a0e27]/90 backdrop-blur-md shadow-lg border-b border-white/10"
            : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <motion.div
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center"
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="font-bold text-white">DF</span>
              </motion.div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                DineFlow
              </h1>
            </motion.div>

            <div className="hidden md:flex items-center space-x-8">
              {["Features", "How It Works", "Demo and Media", "Contact Us"].map(
                (item) => (
                  <motion.a
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-gray-300 hover:text-white transition-colors relative"
                    whileHover={{ y: -2 }}
                  >
                    {item}
                    <motion.div
                      className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400"
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.a>
                )
              )}
            </div>

            <div className="flex items-center space-x-4">
              <motion.button
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 backdrop-blur-lg transition-all border border-white/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/login")}
              >
                Login
              </motion.button>
              <motion.button
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/20"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/signup")}
              >
                Get Started
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center pt-16 px-4 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl"
        >
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Revolutionize
            </span>{" "}
            Your Restaurant Experience
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            The all-in-one platform that transforms how restaurants operate.
            Powerful tools designed for the modern dining experience.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <motion.button
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 font-medium text-lg transition-all shadow-lg shadow-blue-500/30"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/signup")}
            >
              Start Your Transformation
            </motion.button>
          </motion.div>
        </motion.div>

        {/* App Preview */}
        <motion.div
          className="mt-20 relative w-full max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <motion.div
            className="relative"
            transition={{ type: "spring", stiffness: 100 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl rounded-full"></div>
            <div className="relative bg-gradient-to-b from-gray-900/80 to-gray-900 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 h-10 flex items-center px-4 border-b border-white/5">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/70 rounded-xl p-6 h-80 border border-white/5">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Live Orders</h3>
                        <div className="text-sm bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          4 Active
                        </div>
                      </div>
                      <div className="space-y-3">
                        {[1, 2, 3, 4].map((item) => (
                          <motion.div
                            key={item}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800/40 to-gray-800/20 rounded-xl border border-white/5"
                            whileHover={{ y: -3 }}
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mr-3">
                                <span className="text-sm">T{item}</span>
                              </div>
                              <div>Table {item}</div>
                            </div>
                            <div className="text-sm bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                              Preparing
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/70 rounded-xl p-6 h-80 border border-white/5">
                      <h3 className="font-bold text-lg mb-4">Today's Stats</h3>
                      <div className="space-y-4">
                        {[
                          {
                            label: "Orders",
                            value: 24,
                            width: "80%",
                            color: "bg-blue-500",
                          },
                          {
                            label: "Revenue",
                            value: "$1,245",
                            width: "65%",
                            color: "bg-green-500",
                          },
                          {
                            label: "Avg. Time",
                            value: "12m",
                            width: "45%",
                            color: "bg-cyan-500",
                          },
                          {
                            label: "Satisfaction",
                            value: "94%",
                            width: "90%",
                            color: "bg-purple-500",
                          },
                        ].map((stat, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.4 + index * 0.1 }}
                          >
                            <div className="flex justify-between text-sm mb-1">
                              <span>{stat.label}</span>
                              <span>{stat.value}</span>
                            </div>
                            <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${stat.color}`}
                                initial={{ width: 0 }}
                                animate={{ width: stat.width }}
                                transition={{
                                  duration: 0.8,
                                  delay: 1.6 + index * 0.1,
                                }}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section id="features" className="py-28 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Elevate Your Restaurant Operations
            </motion.h2>
            <motion.p
              className="text-gray-400 max-w-2xl mx-auto text-lg"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              Everything you need to streamline operations, delight customers,
              and boost profits
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`bg-gradient-to-br ${feature.color}/10 to-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10 overflow-hidden relative`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-gradient-to-r from-white/5 to-transparent"></div>
                <div className="flex flex-col h-full">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-400 mb-6 flex-grow">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-28 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How DineFlow Works
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Simple setup, powerful results - transform your restaurant in 3
              easy steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Sign Up & Setup",
                description:
                  "Create your account and customize your restaurant profile in minutes",
                color: "from-blue-500/10 to-cyan-500/10",
              },
              {
                step: "2",
                title: "Integrate Your Systems",
                description:
                  "Connect your POS, payment systems, and other tools seamlessly",
                color: "from-purple-500/10 to-pink-500/10",
              },
              {
                step: "3",
                title: "Start Managing",
                description:
                  "Access real-time data and manage your restaurant operations efficiently",
                color: "from-amber-500/10 to-orange-500/10",
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                className={`bg-gradient-to-br ${step.color} backdrop-blur-sm rounded-2xl p-8 border border-white/10 relative overflow-hidden`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <div className="absolute top-4 right-4 text-6xl font-bold text-white/10">
                  {step.step}
                </div>
                <div className="relative z-10">
                  <div className="text-4xl mb-4">Step {step.step}</div>
                  <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                  <p className="text-gray-300">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="demo-media" className="py-28 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              See DineFlow in Action
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Watch our demo to discover how DineFlow can streamline your
              restaurant operations.
            </p>
          </motion.div>

          <div className="aspect-w-16 aspect-h-9 bg-gray-800 rounded-xl overflow-hidden shadow-lg">
            <iframe
              className="w-full h-full"
              src=""
              title="DineFlow Demo Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      <section id="contact-us" className="py-28 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get In Touch
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Have questions? Reach out to our team and let us help you get
              started with DineFlow today.
            </p>
          </motion.div>

          <form className="max-w-2xl mx-auto bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-lg">
            <div className="grid grid-cols-1 gap-6">
              <input
                type="text"
                placeholder="Your Name"
                className="p-4 bg-white/10 rounded-lg text-white placeholder-gray-300 focus:outline-none"
              />
              <input
                type="email"
                placeholder="Your Email"
                className="p-4 bg-white/10 rounded-lg text-white placeholder-gray-300 focus:outline-none"
              />
              <textarea
                placeholder="Your Message"
                rows="5"
                className="p-4 bg-white/10 rounded-lg text-white placeholder-gray-300 focus:outline-none"
              ></textarea>
              <button className="px-8 py-3.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 font-medium transition-all shadow-lg shadow-blue-500/30">
                Send Message
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};
