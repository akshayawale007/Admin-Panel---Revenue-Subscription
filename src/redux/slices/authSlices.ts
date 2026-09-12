import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

export const logOutAsync = createAsyncThunk("auth/logOutAsync", async () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("userData")
    document.cookie = "adminToken=; path=/; max-age=0;"
  }
  return { success: true }
})

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null as { name?: string } | null,
    authToken: null as string | null,
    loading: false,
    submitting: false,
    error: null as string | null,
    isSubmitting: false,
    isVerifying: false,
    sidebar: false,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
    },
    logout: (state) => {
      state.user = null
      state.authToken = null
      state.loading = false
      state.error = null
      if (typeof window !== "undefined") {
        localStorage.removeItem("adminToken")
        localStorage.removeItem("userData")
        document.cookie = "adminToken=; path=/; max-age=0;"
      }
    },
    setSidebar: (state, action) => {
      state.sidebar = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logOutAsync.pending, (state) => {
        state.loading = true
      })
      .addCase(logOutAsync.fulfilled, (state) => {
        state.loading = false
        state.user = null
        state.authToken = null
      })
      .addCase(logOutAsync.rejected, (state) => {
        state.loading = false
        state.error = "Logout failed"
      })
  },
})

export const { logout, setUser, setSidebar } = authSlice.actions
export default authSlice.reducer
